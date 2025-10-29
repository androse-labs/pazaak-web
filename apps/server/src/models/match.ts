import { type ServerWebSocket } from 'bun'
import { boardTotal, Game, type GameState } from './game'
import { WSContext } from 'hono/ws'
import { type MatchAction } from './actions'
import { type Player } from './players'
import { type Card, type PlayerView } from '@pazaak-web/shared'
import { Deck } from './deck'
import { processCardEffects } from './card'

type WaitingMatch = {
  status: 'waiting'
  players: [Player, null]
}

type InProgressMatch = {
  status: 'in-progress' | 'finished'
  players: [Player, Player]
}

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
    this.players = [firstPlayer, null] // Second player will join later
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

    // draw card from board deck to first player's board
    const game = this.games[index]
    if (!game) {
      throw new Error('No current game to draw a card for')
    }

    // todo this should vary
    const board = game.boards[playerIdFirst]
    const drawnCard = game.deck.cards.pop()
    if (!drawnCard) {
      throw new Error('No cards left in the deck to draw')
    }
    board.push(drawnCard)

    this.forEachPlayer((p) => {
      p.status = 'playing'
    })
  }

  startMatch(secondPlayer: Player): void {
    this.touch()

    if (this.status !== 'waiting') {
      throw new Error('Match is already in progress or finished')
    }
    if (!this.players[0]) {
      throw new Error('First player must be present to start the match')
    }
    this.players[1] = secondPlayer
    this.status = 'in-progress'

    // Each player draws 4 cards from their decks
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
    if (!player) {
      throw new Error('Player not found')
    }

    if (this.status !== 'in-progress') {
      throw new Error('Match is not in progress')
    }

    const cardIndex = player.hand.findIndex(
      (card) =>
        card.type === cardToPlay.type && card.value === cardToPlay.value,
    )

    const card = player.hand.splice(cardIndex, 1)[0]
    if (!card) {
      throw new Error('Card not found in hand')
    }

    const currentGame = this.getCurrentGame()

    currentGame.boards[playerId].push(cardToPlay)

    processCardEffects(cardToPlay, currentGame.boards[playerId])
  }

  // Check which player won the match by reaching 3 points
  checkMatchWinner(): string | null {
    if (this.players[0] === null || this.players[1] === null) {
      throw new Error('Both players must be present to check for a winner')
    }

    if (this.score[0] >= 3) {
      return this.players[0].id
    } else if (this.score[1] >= 3) {
      return this.players[1].id
    }
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
    if (player) {
      player.wsConnected = true
      player.sendEvent = (event) => {
        connection.send(JSON.stringify(event))
      }
    } else {
      throw new Error('Player not found in match')
    }
  }

  clearPlayerConnection(playerId: string): void {
    const player = this.getPlayerById(playerId)
    if (player) {
      player.wsConnected = false
      player.sendEvent = () => null
    } else {
      throw new Error('Player not found in match')
    }
  }

  requestRematch(playerId: string): void {
    this.touch()
    if (this.status !== 'finished') {
      throw new Error('Match is not finished')
    }

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
    this.forEachPlayer((player) => {
      player.sendEvent({ type: 'rematchAccepted' })
    })
  }

  private resetMatchState(): void {
    this.games = []
    this.round = 0
    this.score = [0, 0]
    this.status = 'in-progress'
    this.playersTurn = 1
    this.rematchRequestedBy = null

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
    if (this.status !== 'finished') {
      throw new Error('Match is not finished')
    }

    if (this.rematchRequestedBy === null) {
      throw new Error('No rematch has been requested')
    }

    if (this.rematchRequestedBy === playerId) {
      throw new Error('You cannot accept your own rematch request')
    }

    // Reset match state
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
    if (!player) {
      throw new Error('Player not found in match')
    }
    return this.playersTurn === this.players.indexOf(player) + 1
  }

  finalizeGame(): void {
    if (!this.isInProgress()) {
      throw new Error('Match is not ready to finalize the game')
    }

    const currentGame = this.getCurrentGame()

    // Determine winner of this game
    const winnerIndex =
      currentGame.determineTooManyConditionWinner() ||
      currentGame.determineWinner()

    console.log(`Game winner index: ${winnerIndex}`)

    if (winnerIndex !== null) {
      this.score[winnerIndex] += 1
      // Check match winner
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
      // In case of a tie, randomly select who starts
      this.playersTurn = Math.random() < 0.5 ? 1 : 2
    }

    this.addGame(new Game(this.players[0].id, this.players[1].id))
    this.startGame(
      this.games.length - 1,
      this.players[this.playersTurn - 1]!.id,
    )
  }

  // Swap to the next players turn, unless the next player is standing
  nextTurn(): void {
    if (this.status !== 'in-progress') {
      throw new Error('Match is not in progress')
    }

    const currentGame = this.getCurrentGame()

    currentGame.turn += 1

    // Check game end conditions after drawing
    const allStandingOrBusted = this.players.every(
      (p) => p && (p.status === 'standing' || p.status === 'busted'),
    )

    if (allStandingOrBusted) {
      this.finalizeGame()
      return
    }

    // Switch to the other player
    this.playersTurn = this.playersTurn === 1 ? 2 : 1

    // Find the next active player (not standing)
    let currentPlayer = this.players[this.playersTurn - 1]

    while (
      currentPlayer?.status === 'standing' ||
      currentPlayer?.status === 'busted'
    ) {
      this.playersTurn = this.playersTurn === 1 ? 2 : 1
      currentPlayer = this.players[this.playersTurn - 1]
    }

    if (!currentPlayer) {
      throw new Error('Current player not found in match')
    }

    if (currentPlayer.status === 'playing') {
      const drawnCard = currentGame.deck.cards.pop()
      if (!drawnCard) {
        throw new Error('No cards left in game deck')
      }
      currentGame.boards[currentPlayer.id].push(drawnCard)

      const winnerIndex = currentGame.determineTooManyConditionWinner()
      if (winnerIndex !== null) {
        this.finalizeGame()
        return
      }
    }
  }

  performAction(
    playerId: string,
    action: MatchAction,
  ): { success: true } | { success: false; reason: string } {
    this.touch()

    const validation = this.isActionValid(playerId, action)
    if (!validation.valid) {
      return { success: false, reason: validation.reason }
    }

    const player = this.getPlayerById(playerId)
    if (!player) {
      throw new Error('Player not found in match')
    }

    const currentGame = this.getCurrentGame()

    const playerBoard = currentGame.boards[playerId]
    const playerTotal = boardTotal(playerBoard)

    switch (action.type) {
      case 'play': {
        const cardIndex = player.hand.findIndex(
          (card) =>
            card.type === action.card.type && card.value === action.card.value,
        )
        console.log(
          `Player ${playerId} is playing card: ${JSON.stringify(action.card)}`,
        )
        if (cardIndex === -1) {
          throw new Error('Card not found in hand')
        }
        this.playCard(playerId, action.card)

        // Check too many condition
        const winnerIndex = currentGame.determineTooManyConditionWinner()
        if (winnerIndex !== null) {
          console.log(
            `Player ${playerId} has won the game by too many condition`,
          )
          this.finalizeGame()
          return { success: true }
        }
        break
      }

      case 'end':
        if (playerTotal > 20) {
          player.status = 'busted'
        }
        this.nextTurn()
        break

      case 'stand':
        if (playerTotal > 20) {
          player.status = 'busted'
        } else {
          player.status = 'standing'
        }
        this.nextTurn()
        break

      default:
        throw new Error('Invalid action type')
    }

    this.notifyPlayersAboutGameState()

    return { success: true }
  }

  isActionValid(
    playerId: string,
    action: MatchAction,
  ): { valid: true } | { valid: false; reason: string } {
    const player = this.getPlayerById(playerId)
    if (!player) {
      return { valid: false, reason: 'Player not found in match' }
    }

    if (this.status !== 'in-progress') {
      return { valid: false, reason: 'Match is not in progress' }
    }

    if (!this.isPlayerTurn(playerId)) {
      return { valid: false, reason: 'It is not your turn' }
    }

    switch (action.type) {
      case 'play': {
        if (player.hand.length === 0) {
          return { valid: false, reason: 'You have no cards in hand' }
        }

        // check if card exists in hand
        const cardIndex = player.hand.findIndex(
          (card) =>
            card.id === action.card.id &&
            card.type === action.card.type &&
            card.value === action.card.value,
        )

        if (cardIndex === -1) {
          return { valid: false, reason: 'Card not found in hand' }
        }

        // Check if the card can be played
        const currentGame = this.getCurrentGame()

        // Double cards can only be played if the last card on the board is not a double, invert cards
        if (action.card.type === 'double') {
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
    if (!player) {
      throw new Error('Player not found in match')
    }

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
        deck: {
          cards: [...game.deck.cards],
        },
        turn: game.turn,
        winner: game.winner,
      })),
      round: this.round,
      score: this.score,
      status: this.status,
    }
  }
}

export { Match }
