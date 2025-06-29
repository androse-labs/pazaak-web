import { Card } from './card'
import { Deck } from './deck'

class Game {
  boards: Record<string, Card[]> = {}
  deck: Deck = new Deck()
  turn: number = 1
  winnner: string | null = null

  constructor(player1Id: string, player2Id: string) {
    this.deck.defaultFill()
    this.deck.shuffle()
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

  checkWinner(): number | null {
    const player1_total = this.boardTotal(this.boards[0])
    const player2_total = this.boardTotal(this.boards[1])

    const player1_distance = 20 - player1_total
    const player2_distance = 20 - player2_total

    if (player1_distance < 0) {
      if (player2_distance < 0) {
        // Both players busted
        return null
      } else {
        // Player 1 busted
        return 1
      }
    } else if (player2_distance < 0) {
      // Player 2 busted
      return 0
    } else if (player2_distance == player1_distance) {
      if (this.boardHasTiebreaker(this.boards[0])) {
        // Player 1 has tiebreaker
        return 0
      } else if (this.boardHasTiebreaker(this.boards[1])) {
        // Player 2 has tiebreaker
        return 1
      } else {
        // No tiebreaker, it's a tie
        return null
      }
    } else {
      // Player 2 is closer to 20
      return 1
    }
  }
}

export { Game }
