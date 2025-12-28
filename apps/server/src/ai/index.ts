import { type Card, type PlayerView } from '@pazaak-web/shared'
import { boardHasActiveTiebreaker, boardTotal } from '../models/game'
import { processCardEffects } from '../models/card'
import type { MatchAction } from '../models/actions'
import { Deck } from '../models/deck'

interface MonteCarloConfig {
  simulations: number
  opponentPolicy: 'heuristic' | 'random'
  deckModel: DeckModel
  maxPlayoutDepth?: number
  // If true, disallow intentionally busting plays; else allow for exploration (slightly slower)
  forbidImmediateBust?: boolean
}

interface DeckModel {
  drawRandomCard(state: InternalState, rng: RNG): Card | null
  sampleOpponentHand(
    state: InternalState,
    rng: RNG,
    desiredSize: number,
  ): Card[]
}

interface InternalState {
  yourBoard: Card[]
  opponentBoard: Card[]
  yourHand: Card[]
  opponentHand: Card[]
  yourState: 'playing' | 'standing' | 'busted'
  opponentState: 'playing' | 'standing' | 'busted'

  yourTurn: boolean
  // Flags to know whether to draw at next turn start
  playerEndedLastTurn: boolean
  opponentEndedLastTurn: boolean

  // Cached totals
  yourTotal: number
  opponentTotal: number

  winner: 'you' | 'opponent' | null
  depth: number
}

interface RNG {
  next(): number // uniform [0,1)
}

class SeededRNG implements RNG {
  private seed: number
  constructor(seed: number) {
    this.seed = seed
  }
  next(): number {
    // xorshift32
    let x = this.seed | 0
    x ^= x << 13
    x ^= x >>> 17
    x ^= x << 5
    this.seed = x
    return ((x >>> 0) % 1_000_000) / 1_000_000
  }
}

function cloneCard(card: Card): Card {
  return { ...card }
}

function deepCloneState(s: InternalState): InternalState {
  return {
    yourBoard: s.yourBoard.map(cloneCard),
    opponentBoard: s.opponentBoard.map(cloneCard),
    yourHand: s.yourHand.map(cloneCard),
    opponentHand: s.opponentHand.map(cloneCard),
    yourState: s.yourState,
    opponentState: s.opponentState,
    yourTurn: s.yourTurn,
    playerEndedLastTurn: s.playerEndedLastTurn,
    opponentEndedLastTurn: s.opponentEndedLastTurn,
    yourTotal: s.yourTotal,
    opponentTotal: s.opponentTotal,
    winner: s.winner,
    depth: s.depth,
  }
}

function resolveWinnerOnStanding(state: InternalState): void {
  const a = state.yourTotal
  const b = state.opponentTotal
  if (a === b) {
    // Tie-breaker: active tiebreaker on board wins
    const youTB = boardHasActiveTiebreaker(state.yourBoard)
    const opTB = boardHasActiveTiebreaker(state.opponentBoard)
    if (youTB && !opTB) {
      state.winner = 'you'
    } else if (opTB && !youTB) {
      state.winner = 'opponent'
    } else {
      // True tie: treat as no winner (value 0.5 later)
      state.winner = null
    }
  } else {
    state.winner = a > b ? 'you' : 'opponent'
  }
}

function isTerminal(state: InternalState): boolean {
  if (state.winner) return true

  if (state.yourState === 'busted') {
    state.winner = 'opponent'
    return true
  }
  if (state.opponentState === 'busted') {
    state.winner = 'you'
    return true
  }

  if (state.yourState === 'standing' && state.opponentState === 'standing') {
    resolveWinnerOnStanding(state)
    return true
  }

  return false
}

function outcomeValue(state: InternalState): number {
  if (state.winner === 'you') return 1
  if (state.winner === 'opponent') return 0
  return 0.5
}

// Heuristic fallback if max depth reached (soft evaluation)
function heuristicValue(state: InternalState): number {
  if (isTerminal(state)) return outcomeValue(state)
  // Reward being ahead, not just proximity to 20
  const advantage =
    state.yourTotal <= 20 && state.yourTotal > state.opponentTotal ? 1 : 0
  const safetyPenaltyYou = state.yourState === 'busted' ? -100 : 0
  const safetyPenaltyOp = state.opponentState === 'busted' ? -100 : 0
  const raw = advantage * 5 + safetyPenaltyYou - safetyPenaltyOp
  return 1 / (1 + Math.exp(-raw / 5))
}

function playCardOntoBoard(board: Card[], card: Card): Card[] {
  // Clone board so we don't mutate original during hypothetical evaluation
  const newBoard = board.map(cloneCard)
  newBoard.push(cloneCard(card))
  // Apply mutation effects
  return processCardEffects(newBoard.at(-1)!, newBoard)
}

function applyPlayCard(
  state: InternalState,
  card: Card,
  isPlayer: boolean,
): void {
  if (isPlayer) {
    const nextBoard = playCardOntoBoard(state.yourBoard, card)
    state.yourBoard = nextBoard
    state.yourTotal = boardTotal(nextBoard)
    if (state.yourTotal > 20) {
      state.yourState = 'busted'
    }
  } else {
    const nextBoard = playCardOntoBoard(state.opponentBoard, card)
    state.opponentBoard = nextBoard
    state.opponentTotal = boardTotal(nextBoard)
    if (state.opponentTotal > 20) {
      state.opponentState = 'busted'
    }
  }
}

function canLegallyPlayDouble(board: Card[]): boolean {
  // processCardEffects will throw if previous card is double or invert; we check the precondition here.
  if (board.length === 0) return false
  const prev = board.at(-1)!
  if (prev.type === 'double' || prev.type === 'invert') return false
  return true
}

function expandPlayableVariants(card: Card): Card[] {
  if (card.type === 'flip' || card.type === 'tiebreaker') {
    return [
      { ...card, magnitude: 'add' },
      { ...card, magnitude: 'subtract' },
    ]
  }
  return [card]
}

function hypotheticalTotalAfterPlay(board: Card[], cardVariant: Card): number {
  try {
    const nextBoard = playCardOntoBoard(board, cardVariant)
    return boardTotal(nextBoard)
  } catch {
    return Number.POSITIVE_INFINITY // Illegal double scenario
  }
}

function doesInvertHaveEffect(card: Card, board: Card[]): boolean {
  if (card.type !== 'invert') return false
  const invertedValues = card.value.split('&').map(Number)
  for (const c of board) {
    if (c.type === 'double' || c.type === 'invert') continue
    if (
      (c.type === 'flip' || c.type === 'tiebreaker') &&
      invertedValues.includes(c.value)
    ) {
      return true // Would change magnitude
    }
    if (invertedValues.includes(Math.abs(c.value))) {
      return true // Would flip sign
    }
  }
  return false
}

function generateLegalActions(
  state: InternalState,
  cfg: MonteCarloConfig,
): MatchAction[] {
  if (!state.yourTurn || state.yourState !== 'playing') return []
  const actions: MatchAction[] = []

  const boardRef = state.yourBoard

  for (const card of state.yourHand) {
    // if (card.type === 'double' && !canLegallyPlayDouble(boardRef)) {
    //   continue
    // }
    for (const variant of expandPlayableVariants(card)) {
      // if (
      //   variant.type === 'invert' &&
      //   !doesInvertHaveEffect(variant, boardRef)
      // ) {
      //   continue // Skip useless invert
      // }
      const currentTotal = boardTotal(boardRef)
      const newTotal = hypotheticalTotalAfterPlay(boardRef, variant)
      // NEW: If already over 20, only allow plays that bring you to 20 or under
      if (currentTotal > 20 && newTotal > 20) {
        continue
      }
      // if (cfg.forbidImmediateBust && newTotal > 20) {
      //   continue
      // }
      if (Number.isFinite(newTotal)) {
        actions.push({ type: 'play', card: variant })
      }
    }
  }

  // Strategic options
  actions.push({ type: 'end' })
  actions.push({ type: 'stand' })

  return actions
}

function chooseRolloutAction(
  state: InternalState,
  cfg: MonteCarloConfig,
  rng: RNG,
): MatchAction {
  const legal = generateLegalActions(state, cfg)
  if (legal.length === 0) return { type: 'end' }

  const total = state.yourTotal
  const oppTotal = state.opponentTotal
  const handSize = state.yourHand.length

  const scored = legal.map((a) => {
    let score = 0
    if (a.type === 'play') {
      const tAfter = hypotheticalTotalAfterPlay(state.yourBoard, a.card)
      // Don't play if you're busted and this card can't unbust you
      if (total > 20 && tAfter > 20) score -= 100
      // Penalize playing if total is very low
      // prefer to end turn and draw more cards
      if (total < 12) score -= 5.0
      // HIGH bonus for hitting exactly 20
      if (tAfter === 20) score += 20.0
      // Medium bonus for 18-19
      else if (tAfter >= 18 && tAfter < 20) score += 2.0

      // Don't waste invert if it has no effect
      if (
        a.card.type === 'invert' &&
        !doesInvertHaveEffect(a.card, state.yourBoard)
      ) {
        score -= 10.0
      }
      // If you can hit 20 with any card, prefer it strongly
      const canHit20 = state.yourHand.some(
        (h) => hypotheticalTotalAfterPlay(state.yourBoard, h) === 20,
      )
      if (canHit20 && tAfter < 20) score += 20.0

      if (
        tAfter >= 18 &&
        tAfter <= 20 && // Would achieve a good score
        state.yourTotal >= 18 &&
        state.yourTotal <= 20 // You're already close
      ) {
        // Penalize playing a card with no strong improvement
        score -= 5.0 // adjust the penalty magnitude as needed
      }
    }
    if (a.type === 'stand') {
      // Reward standing if you're ahead and your opponent is standing
      if (total > oppTotal && state.opponentState === 'standing') {
        score += 5.0
      }
      // Reward standing if you're in a "safe" range
      if (state.yourTotal >= 18 && state.yourTotal <= 20) score += 2.5
      // Reward for having more cards left in hand
      score += state.yourHand.length * 0.5
    }
    if (a.type === 'end') {
      // reward ending turn if your score is low
      if (total < 12) {
        score += 3.0
      }
      // slight penalty for ending turn with many cards left
      score += handSize * 0.2
    }
    return { action: a, raw: score }
  })

  // softmax selection
  const temperature = 1.4
  const weights = scored.map((s) => Math.exp(s.raw / temperature))
  let r = rng.next() * weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < scored.length; i++) {
    r -= weights[i]
    if (r <= 0) return scored[i].action
  }
  return scored[scored.length - 1].action
}

// --------------------------------------------------------------------------------------
// Turn Flow
// --------------------------------------------------------------------------------------
function maybeDrawOnTurnStart(
  state: InternalState,
  deck: DeckModel,
  rng: RNG,
): void {
  if (state.yourTurn) {
    if (state.playerEndedLastTurn && state.yourState === 'playing') {
      const c = deck.drawRandomCard(state, rng)
      if (c) state.yourBoard.push(c)
    }
    state.playerEndedLastTurn = false
  } else {
    if (state.opponentEndedLastTurn && state.opponentState === 'playing') {
      const c = deck.drawRandomCard(state, rng)
      if (c) state.opponentBoard.push(c)
    }
    state.opponentEndedLastTurn = false
  }
}

function advanceTurn(state: InternalState): void {
  state.yourTurn = !state.yourTurn
}

// --------------------------------------------------------------------------------------
// Apply Actions
// --------------------------------------------------------------------------------------
function applyPlayerAction(
  state: InternalState,
  action: MatchAction,
  cfg: MonteCarloConfig,
  rng: RNG,
) {
  if (action.type === 'play') {
    // Remove from hand
    const idx = state.yourHand.findIndex((c) => c.id === action.card.id)
    if (idx !== -1) state.yourHand.splice(idx, 1)
    applyPlayCard(state, action.card, true)
  } else if (action.type === 'stand') {
    state.yourState = 'standing'
  } else if (action.type === 'end') {
    state.playerEndedLastTurn = true
  }

  if (!isTerminal(state)) advanceTurn(state)
}

function applyOpponentAction(
  state: InternalState,
  action: MatchAction,
  cfg: MonteCarloConfig,
  rng: RNG,
) {
  if (action.type === 'play') {
    const idx = state.opponentHand.findIndex((c) => c.id === action.card.id)
    if (idx !== -1) state.opponentHand.splice(idx, 1)
    applyPlayCard(state, action.card, false)
  } else if (action.type === 'stand') {
    state.opponentState = 'standing'
  } else if (action.type === 'end') {
    state.opponentEndedLastTurn = true
  }

  if (!isTerminal(state)) advanceTurn(state)
}

// --------------------------------------------------------------------------------------
// Opponent Policy
// --------------------------------------------------------------------------------------
function opponentChooseAction(
  state: InternalState,
  cfg: MonteCarloConfig,
  rng: RNG,
): MatchAction {
  if (state.yourTurn) {
    return { type: 'end' }
  }

  // If opponent not playing, no action
  if (state.opponentState !== 'playing') return { type: 'end' }

  const total = state.opponentTotal

  // Simple stand logic
  if (total === 20) return { type: 'stand' }

  const hand = state.opponentHand
  const boardRef = state.opponentBoard
  const actions: MatchAction[] = []

  // Generate play variants
  for (const card of hand) {
    if (card.type === 'double' && !canLegallyPlayDouble(boardRef)) {
      continue
    }
    for (const variant of expandPlayableVariants(card)) {
      const newTotal = hypotheticalTotalAfterPlay(boardRef, variant)
      if (cfg.forbidImmediateBust && newTotal > 20) {
        continue
      }
      if (Number.isFinite(newTotal)) {
        actions.push({ type: 'play', card: variant })
      }
    }
  }

  actions.push({ type: 'end' })
  actions.push({ type: 'stand' })

  if (cfg.opponentPolicy === 'random') {
    return actions[Math.floor(rng.next() * actions.length)]
  }

  // Heuristic: prefer closest to 20 without bust, else end/stand rules
  let best: MatchAction | null = null
  let bestScore = -Infinity
  for (const act of actions) {
    if (act.type === 'play') {
      const t = hypotheticalTotalAfterPlay(boardRef, act.card)
      if (t <= 20 && t > bestScore) {
        bestScore = t
        best = act
      }
    }
  }
  if (best) return best

  if (total <= 10) return { type: 'end' }
  if (total >= 18) return { type: 'stand' }
  return { type: 'end' }
}

// --------------------------------------------------------------------------------------
// Simulation (Rollout)
// --------------------------------------------------------------------------------------
function simulateFromState(
  root: InternalState,
  firstAction: MatchAction,
  cfg: MonteCarloConfig,
  rng: RNG,
): number {
  const state = deepCloneState(root)

  // Apply first action
  applyPlayerAction(state, firstAction, cfg, rng)
  if (isTerminal(state)) return outcomeValue(state)

  while (!isTerminal(state)) {
    if (cfg.maxPlayoutDepth && state.depth >= cfg.maxPlayoutDepth) {
      return heuristicValue(state)
    }

    maybeDrawOnTurnStart(state, cfg.deckModel, rng)

    if (state.yourTurn) {
      if (state.yourState !== 'playing') {
        // Pass if no longer active
        advanceTurn(state)
        continue
      }
      const legal = generateLegalActions(state, cfg)
      if (legal.length === 0) {
        advanceTurn(state)
        continue
      }
      // Simple random choice among legal for rollout policy
      const chosen = chooseRolloutAction(state, cfg, rng)
      applyPlayerAction(state, chosen, cfg, rng)
    } else {
      if (state.opponentState !== 'playing') {
        advanceTurn(state)
        continue
      }
      const act = opponentChooseAction(state, cfg, rng)
      applyOpponentAction(state, act, cfg, rng)
    }

    if (isTerminal(state)) break
    state.depth++
  }

  return outcomeValue(state)
}

// --------------------------------------------------------------------------------------
// Public Bot Function
// --------------------------------------------------------------------------------------
export function decideMonteCarloAction(
  gameState: PlayerView,
  cfg?: Partial<MonteCarloConfig>,
  seed: number = Date.now(),
): MatchAction {
  const config: MonteCarloConfig = {
    simulations: cfg?.simulations ?? 750,
    opponentPolicy: cfg?.opponentPolicy ?? 'heuristic',
    deckModel: cfg?.deckModel ?? defaultDeckModel(),
    maxPlayoutDepth: cfg?.maxPlayoutDepth ?? 20,
    forbidImmediateBust: cfg?.forbidImmediateBust ?? true,
  }

  if (!gameState.yourTurn) {
    // Not your turn; return a no-op (could also throw)
    return { type: 'end' }
  }

  const lastGame = gameState.games.at(-1)
  if (!lastGame) throw new Error('Missing game data')

  const initial: InternalState = {
    yourBoard: lastGame.boards.yourBoard.cards.map(cloneCard),
    opponentBoard: lastGame.boards.opponentBoard.cards.map(cloneCard),
    yourHand: gameState.yourHand.map(cloneCard),
    opponentHand: [], // sampled per simulation
    yourState: gameState.yourState,
    opponentState: gameState.opponentState,
    yourTurn: gameState.yourTurn,
    playerEndedLastTurn: false,
    opponentEndedLastTurn: false,
    yourTotal: lastGame.boards.yourBoard.total,
    opponentTotal: lastGame.boards.opponentBoard.total,
    winner: null,
    depth: 0,
  }

  const rng = new SeededRNG(seed)
  const legal = generateLegalActions(initial, config)
  if (legal.length === 0) return { type: 'end' }

  // Accumulate Monte Carlo estimates
  const totals = new Map<
    string,
    { value: number; count: number; action: MatchAction }
  >()
  for (const action of legal) {
    totals.set(actionKey(action), { value: 0, count: 0, action })
  }

  for (const action of legal) {
    const key = actionKey(action)
    const slot = totals.get(key)!
    for (let i = 0; i < config.simulations; i++) {
      const simRoot = deepCloneState(initial)
      // Sample opponent hidden hand each simulation (based on known size)
      simRoot.opponentHand = config.deckModel.sampleOpponentHand(
        simRoot,
        rng,
        gameState.opponentHandSize,
      )
      const val = simulateFromState(simRoot, action, config, rng)
      let adjusted = val
      if (action.type === 'play') {
        const preTotal = initial.yourTotal
        const ct = action.card.type
        if ((ct === 'invert' || ct === 'double') && preTotal < 15)
          adjusted -= 0.04
        if (ct === 'flip' && preTotal < 12) adjusted -= 0.02
      } else if (action.type === 'end') {
        if (initial.yourHand.length <= 2 && initial.yourTotal < 17)
          adjusted += 0.03
      }
      slot.value += adjusted
      slot.count++
    }
  }

  // Pick highest average
  let best: MatchAction = legal[0]
  let bestAvg = -Infinity
  for (const { value, count, action } of totals.values()) {
    const avg = value / count
    if (avg > bestAvg) {
      bestAvg = avg
      best = action
    }
  }

  for (const { value, count, action } of totals.values()) {
    if (action.type === 'play') {
      if (action.card.type == 'flip' || action.card.type == 'tiebreaker') {
        console.log(
          `Action: play ${action.card.type}(${action.card.value},${action.card.magnitude}) avg=${(
            value / count
          ).toFixed(3)} sims=${count}`,
        )
      } else {
        console.log(
          `Action: play ${action.card.type}(${action.card.value}) avg=${(
            value / count
          ).toFixed(3)} sims=${count}`,
        )
      }
    } else {
      // "stand" or "end"
      console.log(
        `Action: ${action.type} avg=${(value / count).toFixed(3)} sims=${count}`,
      )
    }
  }

  return best
}

function actionKey(a: MatchAction): string {
  if (a.type !== 'play') return a.type
  const c = a.card
  switch (c.type) {
    case 'flip':
    case 'tiebreaker':
      return `play:${c.id}:${c.type}:${c.value}:${c.magnitude}`
    default:
      return `play:${c.id}:${c.type}:${c.value}:nil`
  }
}

// --------------------------------------------------------------------------------------
// Default Deck Model (Stub)
// Replace with real remaining-cards tracking logic.
// --------------------------------------------------------------------------------------
function defaultDeckModel(): DeckModel {
  // Example pool; ensure values obey your schema constraints (positive ints for most)
  const pool = new Deck().defaultFill().shuffle().cards

  const demoDeck: Card[] = [
    {
      id: crypto.randomUUID(),
      type: 'tiebreaker',
      value: 1,
      magnitude: 'add',
    },
    { id: crypto.randomUUID(), type: 'double', value: 'D' },
    { id: crypto.randomUUID(), type: 'invert', value: '2&4' },
    { id: crypto.randomUUID(), type: 'add', value: 1 },
    { id: crypto.randomUUID(), type: 'add', value: 1 },
    { id: crypto.randomUUID(), type: 'subtract', value: 1 },
    { id: crypto.randomUUID(), type: 'invert', value: '3&6' },
    { id: crypto.randomUUID(), type: 'subtract', value: 3 },
    { id: crypto.randomUUID(), type: 'flip', value: 2, magnitude: 'add' },
    { id: crypto.randomUUID(), type: 'tiebreaker', value: 2, magnitude: 'add' },
  ]

  const opponentDeck = new Deck().fillWithCustomCards(demoDeck).shuffle()

  return {
    drawRandomCard(_state: InternalState, rng: RNG): Card | null {
      if (pool.length === 0) return null
      const idx = Math.floor(rng.next() * pool.length)
      return cloneCard(pool[idx])
    },

    sampleOpponentHand(
      _state: InternalState,
      rng: RNG,
      desiredSize: number,
    ): Card[] {
      const hand: Card[] = []
      for (let i = 0; i < desiredSize; i++) {
        const c = opponentDeck.cards.pop()
        if (c) hand.push(c)
      }
      return hand
    },
  }
}

// --------------------------------------------------------------------------------------
// (Optional) Export config tuning helper
// --------------------------------------------------------------------------------------
export function createMonteCarloConfig(
  overrides: Partial<MonteCarloConfig>,
): MonteCarloConfig {
  return {
    simulations: overrides.simulations ?? 1000,
    opponentPolicy: overrides.opponentPolicy ?? 'heuristic',
    deckModel: overrides.deckModel ?? defaultDeckModel(),
    maxPlayoutDepth: overrides.maxPlayoutDepth ?? 150,
    forbidImmediateBust: overrides.forbidImmediateBust ?? true,
  }
}
