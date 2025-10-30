import { describe, it, expect } from 'bun:test'
import { decideBotAction } from '../src/ai'
import type { PlayerView } from '@pazaak-web/shared'

describe('Player AI', () => {
  it('stands on a total of 20', () => {
    const gameState: PlayerView = {
      games: [
        {
          boards: {
            yourBoard: {
              cards: [{ id: 'none-1', type: 'none', value: 20 }],
              total: 20,
            },
            opponentBoard: { cards: [], total: 0 },
          },
          turn: 1,
          winner: null,
        },
      ],
      yourHand: [
        { id: 'add-1', type: 'add', value: 3 },
        { id: 'subtract-1', type: 'subtract', value: 2 },
        { id: 'flip-1', type: 'flip', value: 4, magnitude: 'add' },
        {
          id: 'tiebreaker-1',
          type: 'tiebreaker',
          value: 5,
          magnitude: 'subtract',
        },
      ],
      score: { yourScore: 0, opponentScore: 0 },
      yourTurn: true,
      matchName: 'Test Match',
      yourState: 'playing',
      opponentState: 'playing',
      opponentHandSize: 0,
      round: 1,
      opponentConnected: true,
    }

    const action = decideBotAction(gameState)

    expect(action).toEqual({ type: 'stand' })
  })

  it('plays the best card without busting', () => {
    const gameState: PlayerView = {
      games: [
        {
          boards: {
            yourBoard: {
              cards: [{ id: 'none-1', type: 'none', value: 17 }],
              total: 17,
            },
            opponentBoard: { cards: [], total: 0 },
          },
          turn: 1,
          winner: null,
        },
      ],
      yourHand: [
        { id: 'add-1', type: 'add', value: 3 },
        { id: 'subtract-1', type: 'subtract', value: 2 },
        { id: 'flip-1', type: 'flip', value: 4, magnitude: 'add' },
        {
          id: 'tiebreaker-1',
          type: 'tiebreaker',
          value: 5,
          magnitude: 'subtract',
        },
      ],
      score: { yourScore: 0, opponentScore: 0 },
      yourTurn: true,
      matchName: 'Test Match',
      yourState: 'playing',
      opponentState: 'playing',
      opponentHandSize: 0,
      round: 1,
      opponentConnected: true,
    }

    const action = decideBotAction(gameState)

    expect(action).toEqual({
      type: 'play',
      card: { id: 'add-1', type: 'add', value: 3 },
    })
  })

  it.each<{ magnitude: 'add' | 'subtract'; total: number }>([
    { magnitude: 'subtract', total: 24 },
    { magnitude: 'add', total: 16 },
  ])(
    'plays a flip card with configurable magnitude correctly',
    ({ magnitude, total }) => {
      const gameState: PlayerView = {
        games: [
          {
            boards: {
              yourBoard: {
                cards: [{ id: 'none-1', type: 'none', value: total }],
                total: total,
              },
              opponentBoard: { cards: [], total: 0 },
            },
            turn: 1,
            winner: null,
          },
        ],
        yourHand: [
          { id: 'flip-1', type: 'flip', value: 4, magnitude: magnitude },
          {
            id: 'tiebreaker-1',
            type: 'tiebreaker',
            value: 6,
            magnitude: 'subtract',
          },
        ],
        score: { yourScore: 0, opponentScore: 0 },
        yourTurn: true,
        matchName: 'Test Match',
        yourState: 'playing',
        opponentState: 'playing',
        opponentHandSize: 0,
        round: 1,
        opponentConnected: true,
      }

      const action = decideBotAction(gameState)

      expect(action).toEqual({
        type: 'play',
        card: { id: 'flip-1', type: 'flip', value: 4, magnitude: magnitude },
      })
    },
  )

  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])(
    'ends turn when no good plays (%i)',
    (startTotal) => {
      const gameState: PlayerView = {
        games: [
          {
            boards: {
              yourBoard: {
                cards: [{ id: 'none-1', type: 'none', value: startTotal }],
                total: startTotal,
              },
              opponentBoard: { cards: [], total: 0 },
            },
            turn: 1,
            winner: null,
          },
        ],
        yourHand: [
          { id: 'add-1', type: 'add', value: 2 },
          { id: 'subtract-1', type: 'subtract', value: 1 },
          { id: 'flip-1', type: 'flip', value: 2, magnitude: 'add' },
          {
            id: 'tiebreaker-1',
            type: 'tiebreaker',
            value: 1,
            magnitude: 'subtract',
          },
        ],
        score: { yourScore: 0, opponentScore: 0 },
        yourTurn: true,
        matchName: 'Test Match',
        yourState: 'playing',
        opponentState: 'playing',
        opponentHandSize: 0,
        round: 1,
        opponentConnected: true,
      }

      const action = decideBotAction(gameState)

      expect(action).toEqual({ type: 'end' })
    },
  )
})
