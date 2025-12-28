import { describe, it, expect } from 'bun:test'
import { decideMonteCarloAction } from '../src/ai'
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
            opponentBoard: { cards: [], total: 19 },
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

    expect(() => decideMonteCarloAction(gameState)).toUsuallyBe({
      type: 'stand',
    })
  })

  it('reaches for 20 when at 18', () => {
    const gameState: PlayerView = {
      games: [
        {
          boards: {
            yourBoard: {
              cards: [{ id: 'none-1', type: 'none', value: 18 }],
              total: 18,
            },
            opponentBoard: {
              cards: [{ id: 'none-2', type: 'none', value: 19 }],
              total: 19,
            },
          },
          turn: 1,
          winner: null,
        },
      ],
      yourHand: [
        { id: 'add-1', type: 'add', value: 2 },
        { id: 'subtract-1', type: 'subtract', value: 2 },
        { id: 'flip-1', type: 'flip', value: 4, magnitude: 'add' },
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
      opponentState: 'standing',
      opponentHandSize: 4,
      round: 1,
      opponentConnected: true,
    }

    expect(() => decideMonteCarloAction(gameState)).toUsuallyBe({
      type: 'play',
      card: { id: 'add-1', type: 'add', value: 2 },
    })
  })

  it('unbusts with a subtract card', () => {
    const gameState: PlayerView = {
      games: [
        {
          boards: {
            yourBoard: {
              cards: [{ id: 'none-1', type: 'none', value: 22 }],
              total: 17,
            },
            opponentBoard: {
              cards: [{ id: 'none-2', type: 'none', value: 19 }],
              total: 19,
            },
          },
          turn: 1,
          winner: null,
        },
      ],
      yourHand: [
        { id: 'add-1', type: 'add', value: 3 },
        { id: 'subtract-2', type: 'subtract', value: 2 },
        { id: 'flip-1', type: 'flip', value: 4, magnitude: 'add' },
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
      opponentState: 'standing',
      opponentHandSize: 4,
      round: 1,
      opponentConnected: true,
    }

    expect(() => decideMonteCarloAction(gameState)).toUsuallyBe({
      type: 'play',
      card: { id: 'subtract-2', type: 'subtract', value: 2 },
    })
  })

  it('plays a tiebreaker when opponent is standing', () => {
    const gameState: PlayerView = {
      games: [
        {
          boards: {
            yourBoard: {
              cards: [{ id: 'none-1', type: 'none', value: 18 }],
              total: 18,
            },
            opponentBoard: {
              cards: [{ id: 'none-2', type: 'none', value: 19 }],
              total: 19,
            },
          },
          turn: 1,
          winner: null,
        },
      ],
      yourHand: [
        { id: 'flip-1', type: 'flip', value: 4, magnitude: 'add' },
        {
          id: 'tiebreaker-1',
          type: 'tiebreaker',
          value: 1,
          magnitude: 'add',
        },
      ],
      score: { yourScore: 0, opponentScore: 0 },
      yourTurn: true,
      matchName: 'Test Match',
      yourState: 'playing',
      opponentState: 'standing',
      opponentHandSize: 4,
      round: 1,
      opponentConnected: true,
    }

    expect(() => decideMonteCarloAction(gameState)).toUsuallyBe({
      type: 'play',
      card: {
        id: 'tiebreaker-1',
        type: 'tiebreaker',
        value: 1,
        magnitude: 'add',
      },
    })
  })

  it.only('plays on while board totals are low', () => {
    const gameState: PlayerView = {
      games: [
        {
          boards: {
            yourBoard: {
              cards: [{ id: 'none-1', type: 'none', value: 7 }],
              total: 7,
            },
            opponentBoard: {
              cards: [{ id: 'none-2', type: 'none', value: 9 }],
              total: 9,
            },
          },
          turn: 1,
          winner: null,
        },
      ],
      yourHand: [
        { id: 'add-1', type: 'add', value: 3 },
        { id: 'subtract-1', type: 'subtract', value: 2 },
        { id: 'flip-1', type: 'flip', value: 2, magnitude: 'add' },
        {
          id: 'tiebreaker-1',
          type: 'tiebreaker',
          value: 2,
          magnitude: 'subtract',
        },
      ],
      score: { yourScore: 0, opponentScore: 0 },
      yourTurn: true,
      matchName: 'Test Match',
      yourState: 'playing',
      opponentState: 'playing',
      opponentHandSize: 4,
      round: 1,
      opponentConnected: true,
    }

    // expect(() => decideMonteCarloAction(gameState)).toUsuallyBe({
    //   type: 'end',
    // })

    expect(decideMonteCarloAction(gameState)).toEqual({
      type: 'end',
    })
  })

  it('stands when opponent stands and they are behind', () => {
    const gameState: PlayerView = {
      games: [
        {
          boards: {
            yourBoard: {
              cards: [{ id: 'none-1', type: 'none', value: 18 }],
              total: 18,
            },
            opponentBoard: {
              cards: [{ id: 'none-2', type: 'none', value: 17 }],
              total: 17,
            },
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
      opponentState: 'standing',
      opponentHandSize: 4,
      round: 1,
      opponentConnected: true,
    }

    expect(() => decideMonteCarloAction(gameState)).toUsuallyBe({
      type: 'stand',
    })
  })
})
