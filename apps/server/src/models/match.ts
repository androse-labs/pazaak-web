import { ServerWebSocket } from 'bun'
import { Card } from './card'
import { Game, GameState } from './game'
import { WSContext } from 'hono/ws'
import { MatchAction } from './actions'
import { JoinedPlayer, Player, PlayerView } from './players'

class Match {
  id: string
  connections: Map<string, WebSocket> = new Map()
  matchName: string
  games: Game[] = []
  players: [Player, Player]
  playersTurn: 1 | 2 = 1
  round: number
  score: [number, number]
  status: 'waiting' | 'in-progress' | 'finished'

  constructor(id: string, matchName: string, firstPlayer: JoinedPlayer) {
    this.id = id
    this.round = 0
    this.score = [0, 0]
    this.status = 'waiting'
    this.matchName = matchName
    this.games = []
    this.players = [firstPlayer, null] // Second player will join later
  }

  addGame(game: Game): void {
    this.games.push(game)
    this.round += 1
  }

  startMatch(secondPlayer: JoinedPlayer): void {
    if (this.status !== 'waiting') {
      throw new Error('Match is already in progress or finished')
    }
    if (!this.players[0]) {
      throw new Error('First player must be present to start the match')
    }
    this.players[1] = secondPlayer
    this.status = 'in-progress'

    // Each player draws 4 cards from their decks
    this.players.forEach((player) => {
      if (player) {
        player.deck.shuffle()
        const drawnCards = player.deck.cards.splice(0, 4)
        player.hand.push(...drawnCards)
      }
    })

    this.addGame(new Game(this.players[0].id, this.players[1].id))

    // draw card from board deck to first player's board
    const currentGame = this.games[this.games.length - 1]
    if (!currentGame) {
      throw new Error('No current game to draw a card for')
    }

    const player1Board = currentGame.boards[this.players[0].id]
    const drawnCard = currentGame.deck.cards.pop()
    if (!drawnCard) {
      throw new Error('No cards left in the deck to draw')
    }
    player1Board.push(drawnCard)
  }

  playCard(playerId: string, cardToPlay: Card): void {
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

    const currentGame = this.games[this.games.length - 1]
    if (!currentGame) {
      throw new Error('No current game to play the card in')
    }

    currentGame.boards[playerId].push(cardToPlay)

    if (cardToPlay.type === 'double') {
      // If the card is a double, replace the last card on the board
      // with a new card that has double the value of the last card
      const lastCard = currentGame.boards[playerId].slice(-2, -1)[0]
      if (
        lastCard &&
        lastCard.type !== 'double' &&
        lastCard.type !== 'invert'
      ) {
        const newCard: Card = {
          ...lastCard,
          value: lastCard.value * 2,
        }
        currentGame.boards[playerId].splice(-2, 1, newCard)

        return
      }

      throw new Error(
        'Cannot play double card after another double or invert card',
      )
    }

    if (cardToPlay.type === 'invert') {
      // If the card is an invert, replace all cards on the board
      // matching the 2 numbers with their inverted values
      const invertedValues = cardToPlay.value.split('&').map(Number)

      const cardsToModify = currentGame.boards[playerId]

      cardsToModify.map((card) => {
        if (card.type === 'double' || card.type === 'invert') {
          return
        }
        if (invertedValues.includes(card.value)) {
          card.value = card.value * -1
        }
      })
    }
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
    connection: WSContext<ServerWebSocket> | null,
  ): void {
    const player = this.getPlayerById(playerId)
    if (player) {
      player.connection = connection
    } else {
      throw new Error('Player not found in match')
    }
  }

  notifyPlayersAboutGameState(): void {
    this.players.forEach((player) => {
      if (player?.connection) {
        player.connection.send(JSON.stringify(this.getPlayerView(player.id)))
      }
    })
  }

  isPlayerTurn(playerId: string): boolean {
    const player = this.getPlayerById(playerId)
    if (!player) {
      throw new Error('Player not found in match')
    }
    return this.playersTurn === this.players.indexOf(player) + 1
  }

  checkEndOfGame(): void {
    const currentGame = this.games[this.games.length - 1]
    if (!currentGame) return

    // Determine winner of this game
    const winnerIndex = currentGame.checkWinner() // implement this

    if (winnerIndex === null) {
      // No winner, game is a tie
      currentGame.winner = null
      this.notifyPlayersAboutGameState()
      return
    }

    this.score[winnerIndex] += 1

    // Check match winner
    if (this.score[winnerIndex] >= 3) {
      this.status = 'finished'
      this.notifyPlayersAboutGameState()
      return
    }

    // Prepare next game if not match end
    this.addGame(new Game(this.players[0]!.id, this.players[1]!.id))

    // Reset players' status and hands as appropriate
    this.players.forEach((p) => {
      if (p) {
        p.status = 'playing'
        p.hand.push(...p.deck.cards.splice(0, 4)) // draw 4 for new game
      }
    })

    // Reset turn order
    this.playersTurn = 1
    this.notifyPlayersAboutGameState()
  }

  // Swap to the next players turn, unless the next player is standing
  nextTurn(): void {
    if (this.status !== 'in-progress') {
      throw new Error('Match is not in progress')
    }

    const currentGame = this.games[this.games.length - 1]
    if (!currentGame) {
      throw new Error('No current game to proceed to the next turn')
    }

    // Advance to the next player who is not standing
    do {
      this.playersTurn = this.playersTurn === 1 ? 2 : 1
    } while (this.players[this.playersTurn - 1]?.status === 'standing')

    const currentPlayer = this.players[this.playersTurn - 1]
    if (!currentPlayer) throw new Error('Current player not found in match')

    // Draw a card if they're not standing
    if (currentPlayer.status === 'playing') {
      const drawnCard = currentGame.deck.cards.pop()
      if (!drawnCard) {
        throw new Error('No cards left in game deck')
      }
      currentGame.boards[currentPlayer.id].push(drawnCard)
    }

    // Check game end conditions after drawing
    const allStandingOrBusted = this.players.every(
      (p) => p && (p.status === 'standing' || p.status === 'busted'),
    )
    if (allStandingOrBusted) {
      this.checkEndOfGame()
    }

    this.notifyPlayersAboutGameState()
  }

  performAction(
    playerId: string,
    action: MatchAction,
  ): { success: true } | { success: false; reason: string } {
    const validation = this.isActionValid(playerId, action)
    if (!validation.valid) {
      return { success: false, reason: validation.reason }
    }

    const player = this.getPlayerById(playerId)
    if (!player) {
      throw new Error('Player not found in match')
    }

    const currentGame = this.games[this.games.length - 1]
    if (!currentGame) {
      throw new Error('No current game to perform action in')
    }

    switch (action.type) {
      case 'play':
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
        break

      case 'end':
        currentGame.turn += 1
        this.nextTurn()
        break

      case 'stand':
        player.status = 'standing'
        currentGame.turn += 1
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
      case 'play':
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
        const currentGame = this.games[this.games.length - 1]

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

      case 'end':
      case 'stand':
        return { valid: true }

      default:
        return { valid: false, reason: 'Invalid action type' }
    }
  }

  getPlayerView(playerId: string): PlayerView {
    const player = this.getPlayerById(playerId)
    if (!player) {
      throw new Error('Player not found in match')
    }

    const opponent = this.players.find((p) => p?.id !== playerId)

    return {
      matchName: this.matchName,
      games: this.games.map((game) => ({
        boards: {
          yourBoard: {
            cards: game.boards[player.id] || [],
            total: game.boardTotal(game.boards[player.id] || []),
          },
          opponentBoard: {
            cards: game.boards[opponent?.id || ''] || [],
            total: game.boardTotal(game.boards[opponent?.id || ''] || []),
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
      score: this.score,
    }
  }

  getState(): {
    id: string
    matchName: string
    players: Player[]
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
        deck: game.deck,
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
