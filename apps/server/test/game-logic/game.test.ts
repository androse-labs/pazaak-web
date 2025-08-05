import { describe, it, expect } from 'vitest'
import { Game } from '../../src/models/game'
import { type Card } from '@pazaak-web/shared'

describe('Game', () => {
  it('sums the board with none-type cards', () => {
    const game = new Game('player1', 'player2')

    const board: Card[] = [
      { id: 'none-1', type: 'none', value: 5 },
      { id: 'none-2', type: 'none', value: 3 },
    ]

    const total = game.boardTotal(board)
    expect(total).toBe(8)
  })

  it('sums the board with none, add, and subtract cards', () => {
    const game = new Game('player1', 'player2')

    const board: Card[] = [
      { id: 'none-1', type: 'none', value: 5 },
      { id: 'add-1', type: 'add', value: 3 },
      { id: 'subtract-1', type: 'subtract', value: 2 },
    ]

    const total = game.boardTotal(board)
    expect(total).toBe(6)
  })

  it.each<{ magnitude: 'subtract' | 'add'; expected: number }>([
    { magnitude: 'subtract', expected: 2 },
    { magnitude: 'add', expected: 8 },
  ])('sums the board with flip cards', ({ magnitude, expected }) => {
    const game = new Game('player1', 'player2')

    const board: Card[] = [
      { id: 'none-1', type: 'none', value: 5 },
      { id: 'flip-1', type: 'flip', value: 3, magnitude },
    ]

    const total = game.boardTotal(board)
    expect(total).toBe(expected)
  })

  it.each<{ magnitude: 'subtract' | 'add'; expected: number }>([
    { magnitude: 'subtract', expected: 2 },
    { magnitude: 'add', expected: 8 },
  ])('sums the board with tiebreaker cards', ({ magnitude, expected }) => {
    const game = new Game('player1', 'player2')

    const board: Card[] = [
      { id: 'none-1', type: 'none', value: 5 },
      { id: 'tiebreaker-1', type: 'tiebreaker', value: 3, magnitude },
    ]

    const total = game.boardTotal(board)
    expect(total).toBe(expected)
  })

  it('sums the board for complex combinations of cards', () => {
    const game = new Game('player1', 'player2')

    const board: Card[] = [
      { id: 'none-1', type: 'none', value: 5 },
      { id: 'add-1', type: 'add', value: 3 },
      { id: 'subtract-1', type: 'subtract', value: 2 },
      { id: 'flip-1', type: 'flip', value: 4, magnitude: 'add' },
      {
        id: 'tiebreaker-1',
        type: 'tiebreaker',
        value: 6,
        magnitude: 'subtract',
      },
    ]

    const total = game.boardTotal(board)
    expect(total).toBe(4)
  })
})
