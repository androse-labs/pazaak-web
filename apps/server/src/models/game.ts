import { Card } from './card'
import { Deck, DeckState } from './deck'

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

  boardHasTiebreaker(board: Card[]): boolean {
    return board.some((card) => card.type === 'tiebreaker')
  }

  getBustStatus(distance: number): 'busted' | 'safe' {
    return distance < 0 ? 'busted' : 'safe'
  }

  private getTiebreakerAdvantage(): 'player1' | 'player2' | 'both' | 'neither' {
    const player1HasTiebreaker = this.boardHasTiebreaker(
      this.boards[this.player1Id],
    )
    const player2HasTiebreaker = this.boardHasTiebreaker(
      this.boards[this.player2Id],
    )

    if (player1HasTiebreaker && player2HasTiebreaker) return 'both'
    if (player1HasTiebreaker) return 'player1'
    if (player2HasTiebreaker) return 'player2'
    return 'neither'
  }

  determineWinner(): number | null {
    const player1_total = this.boardTotal(this.boards[this.player1Id])
    const player2_total = this.boardTotal(this.boards[this.player2Id])
    const player1_distance = 20 - player1_total
    const player2_distance = 20 - player2_total

    const player1Status = this.getBustStatus(player1_distance)
    const player2Status = this.getBustStatus(player2_distance)

    // Handle bust scenarios
    if (player1Status === 'busted' && player2Status === 'busted') {
      return null // Both busted = tie
    }

    if (player1Status === 'busted') return 1
    if (player2Status === 'busted') return 0

    // Both players are safe - check distances
    if (player1_distance === player2_distance) {
      // Equal distances - check tiebreakers
      const tiebreakerAdvantage = this.getTiebreakerAdvantage()

      switch (tiebreakerAdvantage) {
        case 'player1':
          return 0
        case 'player2':
          return 1
        case 'both':
        case 'neither':
          return null
      }
    }

    // Different distances - closer to 20 wins
    return player1_distance < player2_distance ? 0 : 1
  }
}

export { Game, GameState }
