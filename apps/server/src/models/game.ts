import { Deck, type DeckState } from './deck'
import { type Card } from '@pazaak-web/shared'

type GameState = {
  boards: Record<string, Card[]>
  deck: DeckState
  turn: number
  winner: string | null
}

class Game {
  boards: Record<string, Card[]> = {}
  deck: Deck = new Deck()
  turn: number = 1
  winner: string | null = null

  private player1Id: string
  private player2Id: string

  constructor(player1Id: string, player2Id: string) {
    this.deck.defaultFill()
    this.deck.shuffle()
    this.player1Id = player1Id
    this.player2Id = player2Id
    this.boards[player1Id] = []
    this.boards[player2Id] = []
  }

  boardTotal(board: Card[]): number {
    return board.reduce((total, card) => {
      if (card.type === 'double') {
        return total
      } else if (card.type === 'flip') {
        const sign = card.magnitude === 'subtract' ? -1 : 1
        return total + sign * card.value
      } else if (card.type === 'invert') {
        return total
      } else if (card.type === 'subtract') {
        return total - card.value
      } else if (card.type === 'tiebreaker') {
        const sign = card.magnitude === 'subtract' ? -1 : 1
        return total + sign * card.value
      }
      return total + card.value
    }, 0)
  }

  boardHasActiveTiebreaker(board: Card[]): boolean {
    return board.length > 0 && board.at(-1)?.type === 'tiebreaker'
  }

  getBustStatus(distance: number): 'busted' | 'safe' {
    return distance < 0 ? 'busted' : 'safe'
  }

  private getTiebreakerAdvantage(): 'player1' | 'player2' | 'both' | 'neither' {
    const player1HasTiebreaker = this.boardHasActiveTiebreaker(
      this.boards[this.player1Id],
    )
    const player2HasTiebreaker = this.boardHasActiveTiebreaker(
      this.boards[this.player2Id],
    )

    if (player1HasTiebreaker && player2HasTiebreaker) return 'both'
    if (player1HasTiebreaker) return 'player1'
    if (player2HasTiebreaker) return 'player2'
    return 'neither'
  }

  determineTooManyConditionWinner(): number | null {
    // Check card count win condition
    const player1Total = this.boardTotal(this.boards[this.player1Id])
    const player2Total = this.boardTotal(this.boards[this.player2Id])

    const player1CardCount = this.boards[this.player1Id].length
    const player2CardCount = this.boards[this.player2Id].length

    if (player1CardCount >= 9 && player1Total <= 20) {
      console.log('Player 1 wins by card count')
      return 0 // Player 1 wins by card count
    }

    if (player2CardCount >= 9 && player2Total <= 20) {
      console.log('Player 2 wins by card count')
      return 1 // Player 2 wins by card count
    }

    return null // No winner by card count
  }

  determineWinner(): number | null {
    const player1Total = this.boardTotal(this.boards[this.player1Id])
    const player2Total = this.boardTotal(this.boards[this.player2Id])
    const player1Distance = 20 - player1Total
    const player2Distance = 20 - player2Total

    const player1Status = this.getBustStatus(player1Distance)
    const player2Status = this.getBustStatus(player2Distance)

    // Handle bust scenarios
    if (player1Status === 'busted' && player2Status === 'busted') {
      return null // Both busted = tie
    }

    if (player1Status === 'busted') return 1
    if (player2Status === 'busted') return 0

    // Both players are safe - check distances
    if (player1Distance === player2Distance) {
      // Equal distances - check tiebreakers
      const tiebreakerAdvantage = this.getTiebreakerAdvantage()

      switch (tiebreakerAdvantage) {
        case 'player1':
          return 0
        case 'player2':
          return 1
        case 'both':
        case 'neither':
          console.log('tie baby')
          return null
      }
    }

    // Different distances - closer to 20 wins
    return player1Distance < player2Distance ? 0 : 1
  }
}

export { Game, type GameState }
