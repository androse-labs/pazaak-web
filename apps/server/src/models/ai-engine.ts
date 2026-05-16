import { type Card } from '@pazaak-web/shared'
import { type MatchAction } from './actions'

const KOTOR_DROID_NAMES = ['HK-47', 'T3-M4', 'G0-T0', 'HK-50', 'T3-H8', 'HK-77']

function randomDroidName(): string {
  return KOTOR_DROID_NAMES[
    Math.floor(Math.random() * KOTOR_DROID_NAMES.length)
  ]!
}

// Distributive Omit that preserves discriminated union members
type CardTemplate = Card extends infer C
  ? C extends { id: string }
    ? Omit<C, 'id'>
    : never
  : never

const AI_HAND_DECK: CardTemplate[] = [
  { type: 'add', value: 1 },
  { type: 'add', value: 2 },
  { type: 'add', value: 3 },
  { type: 'subtract', value: 1 },
  { type: 'subtract', value: 2 },
  { type: 'subtract', value: 3 },
  { type: 'double', value: 'D' },
  { type: 'flip', value: 4, magnitude: 'add' },
  { type: 'tiebreaker', value: 2, magnitude: 'add' },
  { type: 'invert', value: '2&4' },
]

function buildAiHandDeck(): Card[] {
  return AI_HAND_DECK.map(
    (card) => ({ ...card, id: crypto.randomUUID() }) as Card,
  )
}

type AiGameView = {
  myTotal: number
  opponentTotal: number
  myBoard: Card[]
  hand: Card[]
  /** True when the AI has already played a hand card this turn. */
  hasPlayedThisTurn?: boolean
}

/** Mirrors the Game.boardTotal logic for simulation purposes. */
function computeBoardTotal(board: Card[]): number {
  return board.reduce((total, card) => {
    if (card.type === 'double' || card.type === 'invert') return total
    if (card.type === 'flip' || card.type === 'tiebreaker') {
      const sign = card.magnitude === 'subtract' ? -1 : 1
      return total + sign * card.value
    }
    if (card.type === 'subtract') return total - card.value
    return total + (card.value as number) // add, none, special (value may be negative after invert)
  }, 0)
}

type CandidatePlay = {
  card: Card
  resultTotal: number
  isTiebreaker: boolean
}

/**
 * Evaluates each Hand card and returns the Board total that would result from
 * playing it. Cards that cannot legally be played are omitted.
 */
function evaluateCandidates(
  hand: Card[],
  myBoard: Card[],
  myTotal: number,
): CandidatePlay[] {
  const candidates: CandidatePlay[] = []

  for (const card of hand) {
    let resultTotal: number | null = null

    switch (card.type) {
      case 'add':
        resultTotal = myTotal + card.value
        break

      case 'subtract':
        resultTotal = myTotal - card.value
        break

      case 'flip':
        resultTotal =
          card.magnitude === 'add' ? myTotal + card.value : myTotal - card.value
        break

      case 'tiebreaker':
        resultTotal =
          card.magnitude === 'add' ? myTotal + card.value : myTotal - card.value
        break

      case 'double': {
        const lastCard = myBoard.at(-1)
        if (
          !lastCard ||
          lastCard.type === 'double' ||
          lastCard.type === 'invert'
        )
          break
        let contribution: number
        switch (lastCard.type) {
          case 'add':
          case 'none':
          case 'special':
            contribution = lastCard.value as number
            break
          case 'subtract':
            contribution = -(lastCard.value as number)
            break
          case 'flip':
          case 'tiebreaker':
            contribution =
              lastCard.magnitude === 'subtract'
                ? -lastCard.value
                : lastCard.value
            break
          default:
            contribution = 0
        }
        resultTotal = myTotal + contribution
        break
      }

      case 'invert': {
        const invertValues = card.value.split('&').map(Number)
        const simulatedBoard = myBoard.map((c): Card => {
          if (c.type === 'double' || c.type === 'invert') return c
          if (
            (c.type === 'flip' || c.type === 'tiebreaker') &&
            invertValues.includes(c.value)
          ) {
            return {
              ...c,
              magnitude: c.magnitude === 'subtract' ? 'add' : 'subtract',
            }
          }
          // add, subtract, none, special — value is numeric
          const numVal = c.value as number
          if (invertValues.includes(Math.abs(numVal))) {
            return { ...c, value: numVal * -1 } as Card
          }
          return c
        })
        resultTotal = computeBoardTotal(simulatedBoard)
        break
      }
    }

    if (resultTotal !== null) {
      candidates.push({
        card,
        resultTotal,
        isTiebreaker: card.type === 'tiebreaker',
      })
    }
  }

  return candidates
}

/**
 * Decides the AI's next single action given the current game state.
 * Call repeatedly until the returned action is 'end' or 'stand'.
 *
 * Hand cards persist across all Games in a Match, so the AI is conservative:
 * it only spends a card when the result is clearly high-value (bust fix, exact
 * 20, tiebreaker in a close position, or landing on 18–20), and never plays
 * more than one card per Turn.
 */
function decideNextAction(view: AiGameView): MatchAction {
  const { myTotal, opponentTotal, myBoard, hand, hasPlayedThisTurn } = view

  // Bust: recover with whatever card brings us back to ≤ 20
  if (myTotal > 20) {
    const fixCandidates = evaluateCandidates(hand, myBoard, myTotal)
      .filter((c) => c.resultTotal > 0 && c.resultTotal <= 20)
      .sort((a, b) => 20 - a.resultTotal - (20 - b.resultTotal)) // closest to 20

    if (fixCandidates.length > 0) {
      return { type: 'play', card: fixCandidates[0]!.card }
    }
    return { type: 'end' }
  }

  const distance = 20 - myTotal

  // Perfect score — Stand immediately
  if (distance === 0) {
    return { type: 'stand' }
  }

  // Already played a card this Turn: don't chain further plays.
  if (hasPlayedThisTurn) {
    return distance <= 3 && myTotal >= opponentTotal
      ? { type: 'stand' }
      : { type: 'end' }
  }

  const validCandidates = evaluateCandidates(hand, myBoard, myTotal).filter(
    (c) => c.resultTotal > 0 && c.resultTotal <= 20,
  )

  // Exact 20 — always play
  const exactCard = validCandidates.find((c) => c.resultTotal === 20)
  if (exactCard) {
    return { type: 'play', card: exactCard.card }
  }

  // Tiebreaker advantage when totals are tied or very close
  const closeGame = Math.abs(myTotal - opponentTotal) <= 2
  if (closeGame) {
    const tiebreakerCandidate = validCandidates
      .filter((c) => c.isTiebreaker && 20 - c.resultTotal <= 3)
      .sort((a, b) => 20 - a.resultTotal - (20 - b.resultTotal))[0]

    if (tiebreakerCandidate) {
      return { type: 'play', card: tiebreakerCandidate.card }
    }
  }

  // Improving card that lands us on 18–19 (distance ≤ 2)
  // Avoid burning cards for marginal gains — Hand cards must last the Match.
  const improvingCandidate = validCandidates
    .filter((c) => 20 - c.resultTotal <= 2)
    .sort((a, b) => 20 - a.resultTotal - (20 - b.resultTotal))[0]

  if (improvingCandidate) {
    return { type: 'play', card: improvingCandidate.card }
  }

  // Stand if we're close enough and not behind the opponent
  if (distance <= 3 && myTotal >= opponentTotal) {
    return { type: 'stand' }
  }

  // Otherwise End Turn and wait for the next card draw
  return { type: 'end' }
}

export { decideNextAction, buildAiHandDeck, randomDroidName, type AiGameView }
