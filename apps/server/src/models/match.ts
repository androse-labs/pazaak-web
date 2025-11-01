import { type ServerWebSocket } from 'bun'
import { boardTotal, Game, type GameState } from './game'
import { WSContext } from 'hono/ws'
import { type MatchAction } from './actions'
import { type Player } from './players'
import { type Card, type PlayerView } from '@pazaak-web/shared'
import { Deck } from './deck'
import { processCardEffects } from './card'
import { decideMonteCarloAction } from '../ai'

type WaitingMatch = {
  status: 'waiting'
  players: [Player, null]
}

type InProgressMatch = {
  status: 'in-progress' | 'finished'
  players: [Player, Player]
}

const BOT_ID = 'bot'
const BOT_THINK_DELAY_MS = 650
const MAX_BOT_PLAYS_PER_TURN = 10

class Match {
  id: string
  matchName: string
  unlisted: boolean
  rematchRequestedBy: string | null = null
  games: Game[] = []
  players: [Player, Player] | [Player, null]
  playersTurn: 1 | 2 = 1
  round: number
  lastModifiedDateUtc: number
  score: [number, number]
  status: 'waiting' | 'in-progress' | 'finished'
  isAiMatch: boolean = false
  // Simple flag to avoid concurrent loops
  private botLoopRunning = false

  constructor(
    id: string,
    matchName: string,
    firstPlayer: Player,
    unlisted: boolean,
  ) {
    this.id = id
    this.round = 0
    this.score = [0, 0]
    this.status = 'waiting'
    this.matchName = matchName
    this.games = []
    this.unlisted = unlisted
    this.lastModifiedDateUtc = Date.now()
    this.players = [firstPlayer, null]
  }

  touch(): void {
    this.lastModifiedDateUtc = Date.now()
  }

  addGame(game: Game): void {
    this.touch()
    this.games.push(game)
    this.round += 1
  }

  startGame(index: number, playerIdFirst: string): void {
    this.touch()
    const game = this.games[index]
    if (!game) throw new Error('No current game to draw a card for')
    const board = game.boards[playerIdFirst]
    const drawnCard = game.deck.cards.pop()
    if (!drawnCard) throw new Error('No cards left in the deck to draw')
    board.push(drawnCard)
    this.forEachPlayer((p) => {
      p.status = 'playing'
    })
    // If bot starts, let it act
    this.maybeStartBotLoop()
  }

  startMatch(secondPlayer: Player): void {
    this.touch()
    if (this.status !== 'waiting')
      throw new Error('Match already started or finished')
    if (!this.players[0]) throw new Error('First player missing')
    this.players[1] = secondPlayer
    this.status = 'in-progress'
    this.forEachPlayer((player) => {
      player.deck.shuffle()
      const drawnCards = player.deck.cards.splice(0, 4)
      player.hand.push(...drawnCards)
    })
    this.addGame(new Game(this.players[0].id, this.players[1].id))
    this.startGame(0, this.players[0].id)
  }

  playCard(playerId: string, cardToPlay: Card): void {
    this.touch()
    const player = this.players.find((p) => p?.id === playerId)
    if (!player) throw new Error('Player not found')
    if (this.status !== 'in-progress') throw new Error('Match not in progress')

    const cardIndex = player.hand.findIndex((c) => c.id === cardToPlay.id)
    const card = player.hand.splice(cardIndex, 1)[0]
    if (!card) throw new Error('Card not found in hand')

    const currentGame = this.getCurrentGame()
    currentGame.boards[playerId].push(cardToPlay)
    processCardEffects(cardToPlay, currentGame.boards[playerId])
  }

  checkMatchWinner(): string | null {
    if (this.players[0] === null || this.players[1] === null) {
      throw new Error('Both players must be present')
    }
    if (this.score[0] >= 3) return this.players[0].id
    if (this.score[1] >= 3) return this.players[1].id
    return null
  }

  getPlayerById(playerId: string): Player | null {
    return this.players.find((p) => p?.id === playerId) || null
  }

  getPlayerByToken(playerToken: string): Player | null {
    return this.players.find((p) => p?.token === playerToken) || null
  }

  updatePlayerConnection(
    playerId: string,
    connection: WSContext<ServerWebSocket>,
  ): void {
    this.touch()
    const player = this.getPlayerById(playerId)
    if (!player) throw new Error('Player not found')
    player.wsConnected = true
    player.sendEvent = (event) => connection.send(JSON.stringify(event))
  }

  clearPlayerConnection(playerId: string): void {
    const player = this.getPlayerById(playerId)
    if (!player) throw new Error('Player not found')
    player.wsConnected = false
    player.sendEvent = () => null
  }

  requestRematch(playerId: string): void {
    this.touch()
    if (this.status !== 'finished') throw new Error('Match not finished')
    this.rematchRequestedBy = playerId
    this.notifyOpponentsAboutRematchRequest(playerId)
  }

  notifyOpponentsAboutRematchRequest(requestingPlayerId: string): void {
    this.forEachPlayer((player) => {
      if (player.id !== requestingPlayerId) {
        player.sendEvent({ type: 'rematchRequested' })
      }
    })
  }

  notifyPlayersAboutRematchAcceptance(): void {
    this.forEachPlayer((player) =>
      player.sendEvent({ type: 'rematchAccepted' }),
    )
  }

  private resetMatchState(): void {
    this.games = []
    this.round = 0
    this.score = [0, 0]
    this.status = 'in-progress'
    this.playersTurn = 1
    this.rematchRequestedBy = null
    this.botLoopRunning = false
    this.forEachPlayer((player) => {
      player.status = 'playing'
      player.hand = []
      player.deck = new Deck().fillWithCustomCards(player.originalDeck)
      const drawnCards = player.deck.cards.splice(0, 4)
      player.hand.push(...drawnCards)
    })
  }

  private forEachPlayer(callback: (player: Player) => void) {
    this.players.forEach((p) => p && callback(p))
  }

  acceptRematch(playerId: string): void {
    this.touch()
    if (this.status !== 'finished') throw new Error('Match not finished')
    if (this.rematchRequestedBy === null)
      throw new Error('No rematch requested')
    if (this.rematchRequestedBy === playerId)
      throw new Error('Cannot accept your own request')
    this.resetMatchState()
    this.addGame(new Game(this.players[0].id, this.players[1]!.id))
    this.startGame(0, this.players[0].id)
    this.notifyPlayersAboutRematchAcceptance()
    this.notifyPlayersAboutGameState()
  }

  notifyPlayersAboutGameState(): void {
    this.forEachPlayer((player) => {
      player.sendEvent({
        type: 'gameStateUpdate',
        ...this.getPlayerView(player.id),
      })
    })
  }

  notifyPlayersAboutGameWinner(): void {
    const currentGame = this.getCurrentGame()
    const winnerIndex =
      currentGame.determineTooManyConditionWinner() ||
      currentGame.determineWinner()
    this.forEachPlayer((player) => {
      const opponent = this.players.find((p) => p?.id !== player.id)
      const playerIndex = this.players.findIndex((p) => p?.id === player.id)
      const opponentIndex = this.players.findIndex(
        (p) => p?.id === opponent?.id,
      )
      if (winnerIndex === null) {
        player.sendEvent({
          type: 'playerScored',
          opponentScore: this.score[opponentIndex],
          yourScore: this.score[playerIndex],
          who: 'no-one',
        })
        return
      }
      player.sendEvent({
        type: 'playerScored',
        opponentScore: this.score[opponentIndex],
        yourScore: this.score[playerIndex],
        who: winnerIndex === playerIndex ? 'you' : 'opponent',
      })
    })
  }

  notifyPlayersAboutMatchWinner(): void {
    const winnerId = this.checkMatchWinner()
    if (winnerId) {
      this.forEachPlayer((player) => {
        player.sendEvent({
          type: 'matchComplete',
          youWon: player.id === winnerId,
        })
      })
    }
  }

  isInProgress(): this is this & InProgressMatch {
    return (
      this.status === 'in-progress' &&
      this.players[0] !== null &&
      this.players[1] !== null
    )
  }

  isWaiting(): this is this & WaitingMatch {
    return (
      this.status === 'waiting' &&
      this.players[0] !== null &&
      this.players[1] === null
    )
  }

  isPlayerTurn(playerId: string): boolean {
    const player = this.getPlayerById(playerId)
    if (!player) throw new Error('Player not found in match')
    return this.playersTurn === this.players.indexOf(player) + 1
  }

  finalizeGame(): void {
    if (!this.isInProgress()) throw new Error('Match not ready to finalize')
    const currentGame = this.getCurrentGame()
    const winnerIndex =
      currentGame.determineTooManyConditionWinner() ||
      currentGame.determineWinner()

    if (winnerIndex !== null) {
      this.score[winnerIndex] += 1
      if (this.score[winnerIndex] >= 3) {
        this.status = 'finished'
        this.notifyPlayersAboutMatchWinner()
        return
      }
    }

    this.notifyPlayersAboutGameWinner()

    if (winnerIndex !== null) {
      this.playersTurn = winnerIndex === 0 ? 1 : 2
    } else {
      this.playersTurn = Math.random() < 0.5 ? 1 : 2
    }

    this.addGame(new Game(this.players[0].id, this.players[1]!.id))
    this.startGame(
      this.games.length - 1,
      this.players[this.playersTurn - 1]!.id,
    )
  }

  nextTurn(): void {
    if (this.status !== 'in-progress') throw new Error('Match not in progress')
    const currentGame = this.getCurrentGame()
    currentGame.turn += 1

    const allStandingOrBusted = this.players.every(
      (p) => p && (p.status === 'standing' || p.status === 'busted'),
    )
    if (allStandingOrBusted) {
      this.finalizeGame()
      return
    }

    this.playersTurn = this.playersTurn === 1 ? 2 : 1

    let currentPlayer = this.players[this.playersTurn - 1]
    while (
      currentPlayer?.status === 'standing' ||
      currentPlayer?.status === 'busted'
    ) {
      this.playersTurn = this.playersTurn === 1 ? 2 : 1
      currentPlayer = this.players[this.playersTurn - 1]
    }

    if (!currentPlayer) throw new Error('Current player not found')

    if (currentPlayer.status === 'playing') {
      const drawnCard = currentGame.deck.cards.pop()
      if (!drawnCard) throw new Error('No cards left in game deck')
      currentGame.boards[currentPlayer.id].push(drawnCard)

      const winnerIndex = currentGame.determineTooManyConditionWinner()
      if (winnerIndex !== null) {
        this.finalizeGame()
        return
      }
    }

    // If it's now the bot's turn, start its loop
    this.maybeStartBotLoop()
  }

  async performAction(
    playerId: string,
    action: MatchAction,
  ): Promise<{ success: true } | { success: false; reason: string }> {
    this.touch()
    const validation = this.isActionValid(playerId, action)
    if (!validation.valid) return { success: false, reason: validation.reason }

    const player = this.getPlayerById(playerId)
    if (!player) throw new Error('Player not found')
    const currentGame = this.getCurrentGame()
    const playerBoard = currentGame.boards[playerId]
    const playerTotal = boardTotal(playerBoard)

    if (playerId === BOT_ID) {
      await delay(BOT_THINK_DELAY_MS)
    }

    switch (action.type) {
      case 'play': {
        const cardIndex = player.hand.findIndex((c) => c.id === action.card.id)
        if (cardIndex === -1) throw new Error('Card not found in hand')
        this.playCard(playerId, action.card)

        const winnerIndex = currentGame.determineTooManyConditionWinner()
        if (winnerIndex !== null) {
          this.finalizeGame()
          this.notifyPlayersAboutGameState()
          return { success: true }
        }

        break
      }
      case 'end':
        if (playerTotal > 20) player.status = 'busted'
        this.nextTurn()
        break
      case 'stand':
        if (playerTotal > 20) player.status = 'busted'
        else player.status = 'standing'
        this.nextTurn()
        break
      default:
        throw new Error('Invalid action type')
    }

    this.notifyPlayersAboutGameState()

    // After a bot play, if bot still has turn and is playing, continue loop.
    if (
      playerId === BOT_ID &&
      action.type === 'play' &&
      this.status === 'in-progress' &&
      this.isPlayerTurn(BOT_ID) &&
      player.status === 'playing'
    ) {
      this.maybeStartBotLoop()
    }

    return { success: true }
  }

  isActionValid(
    playerId: string,
    action: MatchAction,
  ): { valid: true } | { valid: false; reason: string } {
    const player = this.getPlayerById(playerId)
    if (!player) return { valid: false, reason: 'Player not found in match' }
    if (this.status !== 'in-progress')
      return { valid: false, reason: 'Match is not in progress' }
    if (!this.isPlayerTurn(playerId))
      return { valid: false, reason: 'It is not your turn' }

    switch (action.type) {
      case 'play': {
        if (player.hand.length === 0)
          return { valid: false, reason: 'You have no cards in hand' }
        const idx = player.hand.findIndex(
          (card) =>
            card.id === action.card.id &&
            card.type === action.card.type &&
            card.value === action.card.value,
        )
        if (idx === -1)
          return { valid: false, reason: 'Card not found in hand' }

        if (action.card.type === 'double') {
          const currentGame = this.getCurrentGame()
          const lastCard = currentGame.boards[playerId].slice(-1)[0]
          if (
            lastCard &&
            (lastCard.type === 'double' || lastCard.type === 'invert')
          ) {
            return {
              valid: false,
              reason:
                'Cannot play double card after another double or invert card',
            }
          }
        }
        return { valid: true }
      }
      case 'end':
      case 'stand':
        return { valid: true }
      default:
        return { valid: false, reason: 'Invalid action type' }
    }
  }

  getCurrentGame(): Game {
    const currentGame = this.games[this.games.length - 1]
    if (!currentGame) throw new Error('No current game in match')
    return currentGame
  }

  getPlayerView(playerId: string): PlayerView {
    const player = this.getPlayerById(playerId)
    if (!player) throw new Error('Player not found in match')
    const opponent = this.players.find((p) => p?.id !== playerId)
    const playerIndex = this.players.findIndex((p) => p?.id === playerId)
    const opponentIndex = this.players.findIndex((p) => p?.id === opponent?.id)

    return {
      matchName: this.matchName,
      games: this.games.map((game) => ({
        boards: {
          yourBoard: {
            cards: game.boards[player.id] || [],
            total: boardTotal(game.boards[player.id] || []),
          },
          opponentBoard: {
            cards: game.boards[opponent?.id || ''] || [],
            total: boardTotal(game.boards[opponent?.id || ''] || []),
          },
        },
        turn: game.turn,
        winner: game.winner,
      })),
      yourTurn: this.isPlayerTurn(playerId),
      yourState: player.status,
      yourHand: player.hand,
      opponentState: opponent ? opponent.status : 'playing',
      opponentHandSize: opponent ? opponent.hand.length : 0,
      round: this.round,
      opponentConnected: opponent ? opponent.wsConnected : false,
      score: {
        yourScore: this.score[playerIndex],
        opponentScore: this.score[opponentIndex],
      },
    }
  }

  getState(): {
    id: string
    matchName: string
    players: (Player | null)[]
    games: GameState[]
    round: number
    score: [number, number]
    status: 'waiting' | 'in-progress' | 'finished'
  } {
    return {
      id: this.id,
      matchName: this.matchName,
      players: this.players,
      games: this.games.map((game) => ({
        boards: game.boards,
        deck: { cards: [...game.deck.cards] },
        turn: game.turn,
        winner: game.winner,
      })),
      round: this.round,
      score: this.score,
      status: this.status,
    }
  }

  // ---------------- Bot Support (Simple) ----------------

  private maybeStartBotLoop(): void {
    if (
      !this.isInProgress() ||
      !this.isPlayerTurn(BOT_ID) ||
      this.botLoopRunning
    ) {
      return
    }
    const botPlayer = this.getPlayerById(BOT_ID)
    if (!botPlayer || botPlayer.status !== 'playing') return
    this.runBotTurnLoop().catch((e) => console.error('Bot loop error', e))
  }

  private async runBotTurnLoop(): Promise<void> {
    this.botLoopRunning = true
    try {
      let plays = 0
      while (
        this.status === 'in-progress' &&
        this.isPlayerTurn(BOT_ID) &&
        plays < MAX_BOT_PLAYS_PER_TURN
      ) {
        const botPlayer = this.getPlayerById(BOT_ID)
        if (!botPlayer || botPlayer.status !== 'playing') {
          console.log('Bot is no longer active, ending bot loop')
          break
        }
        const view = this.getPlayerView(BOT_ID)
        const action = decideMonteCarloAction(view, {
          simulations: 500,
        })

        console.log(`Bot decided to ${JSON.stringify(action)}`)
        await this.performAction(BOT_ID, action)
        // If action ended turn or bot is no longer active, stop
        if (action.type !== 'play') {
          console.log('Bot ended its turn, exiting bot loop')
          break
        }
        plays++
      }
    } catch (e) {
      console.log('Error during bot turn loop:', e)
    } finally {
      console.log('Bot turn loop ended')
      this.botLoopRunning = false
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export { Match }
