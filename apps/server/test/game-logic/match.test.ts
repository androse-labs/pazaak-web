import { describe, it, expect } from 'bun:test'
import { createTestMatch, createTestPlayer } from './match-helper'
import { Game } from '../../src/models/game'
import { MatchAction } from '../../src/models/actions'

describe('Match', () => {
  it('adds a new game to the match', () => {
    const match = createTestMatch()
    const game = new Game(match.players[0]!.id, match.players[1]!.id)
    match.addGame(game)

    expect(match.games).toHaveLength(1)
    expect(match.games[0]).toEqual(game)
  })

  it('outputs the match state correctly', () => {
    const match = createTestMatch({
      matchName: 'Test Match',
      players: [
        {
          ...createTestPlayer(),
          id: 'player1',
          token: 'abc123',
        },
        {
          ...createTestPlayer(),
          id: 'player2',
          token: 'def456',
        },
      ],
      status: 'in-progress',
      score: [0, 0],
      round: 0,
    })
    const game = new Game('player1', 'player2')
    match.addGame(game)

    const state = match.getState()

    expect(state).toEqual({
      id: match.id,
      matchName: 'Test Match',
      players: [
        {
          id: 'player1',
          token: 'abc123',
          status: 'playing',
          deck: match.players[0]!.deck,
          hand: [],
          connection: null,
        },
        {
          id: 'player2',
          token: 'def456',
          status: 'playing',
          deck: match.players[1]!.deck,
          hand: [],
          connection: null,
        },
      ],
      games: [
        {
          winner: null,
          deck: expect.any(Object),
          turn: 1,
          boards: {
            [match.players[0]!.id]: [],
            [match.players[1]!.id]: [],
          },
        },
      ],
      round: 1,
      score: [0, 0],
      status: 'in-progress',
    })
  })

  it('shows a player their appropriate view of the match', () => {
    const match = createTestMatch({
      players: [
        {
          ...createTestPlayer(),
          id: 'player1',
          token: 'abc123',
          hand: [
            { id: '1', type: 'flip', value: 5, magnitude: 'subtract' },
            {
              id: '2',
              type: 'add',
              value: 3,
            },
          ],
        },
        {
          ...createTestPlayer(),
          id: 'player2',
          token: 'def456',
          hand: [
            { id: '1', type: 'flip', value: 5, magnitude: 'add' },
            {
              id: '2',
              type: 'subtract',
              value: 3,
            },
          ],
        },
      ],
      status: 'in-progress',
      score: [0, 0],
      round: 0,
    })
    const game = new Game('player1', 'player2')
    match.addGame(game)

    const player1View = match.getPlayerView('player1')
    const player2View = match.getPlayerView('player2')

    expect(player1View).toEqual({
      matchName: 'Test Match',
      opponentHandSize: 2,
      opponentState: 'playing',
      yourHand: [
        { id: '1', type: 'flip', value: 5, magnitude: 'subtract' },
        { id: '2', type: 'add', value: 3 },
      ],
      yourState: 'playing',
      yourTurn: true,
      games: [
        {
          winner: null,
          turn: 1,
          boards: {
            yourBoard: {
              cards: [],
              total: 0,
            },
            opponentBoard: {
              cards: [],
              total: 0,
            },
          },
        },
      ],
      round: 1,
      score: [0, 0],
    })

    expect(player2View).toEqual({
      matchName: 'Test Match',
      opponentHandSize: 2,
      opponentState: 'playing',
      yourHand: [
        { id: '1', type: 'flip', value: 5, magnitude: 'add' },
        { id: '2', type: 'subtract', value: 3 },
      ],
      yourState: 'playing',
      yourTurn: false,
      games: [
        {
          winner: null,
          turn: 1,
          boards: {
            yourBoard: {
              cards: [],
              total: 0,
            },
            opponentBoard: {
              cards: [],
              total: 0,
            },
          },
        },
      ],
      round: 1,
      score: [0, 0],
    })
    expect(player1View).not.toEqual(player2View)
  })

  describe('isActionValid', () => {
    it('returns true for a valid action', () => {
      const match = createTestMatch({
        players: [
          {
            ...createTestPlayer(),
            id: 'player1',
            hand: [
              { id: '1', type: 'flip', value: 5, magnitude: 'subtract' },
              {
                id: '2',
                type: 'add',
                value: 3,
              },
            ],
          },
          {
            ...createTestPlayer(),
            id: 'player2',
            hand: [
              { id: '1', type: 'flip', value: 5, magnitude: 'add' },
              {
                id: '2',
                type: 'subtract',
                value: 3,
              },
            ],
          },
        ],
        status: 'in-progress',
      })

      const game = new Game('player1', 'player2')
      match.addGame(game)

      const action: MatchAction = {
        type: 'play',
        card: { id: '1', type: 'flip', value: 5, magnitude: 'subtract' },
      }

      expect(match.isActionValid('player1', action)).toEqual({
        valid: true,
      })
    })

    it('returns false for an invalid action', () => {
      const match = createTestMatch({
        players: [
          {
            ...createTestPlayer(),
            id: 'player1',
            hand: [
              { id: '1', type: 'flip', value: 5, magnitude: 'subtract' },
              {
                id: '2',
                type: 'add',
                value: 3,
              },
            ],
          },
          {
            ...createTestPlayer(),
            id: 'player2',
            hand: [
              { id: '1', type: 'flip', value: 5, magnitude: 'add' },
              {
                id: '2',
                type: 'subtract',
                value: 3,
              },
            ],
          },
        ],
        status: 'in-progress',
      })

      const game = new Game('player1', 'player2')
      match.addGame(game)

      const action: MatchAction = {
        type: 'play',
        card: { id: '3', type: 'flip', value: 10, magnitude: 'add' }, // Card not in hand
      }

      expect(match.isActionValid('player1', action)).toEqual({
        valid: false,
        reason: 'Card not found in hand',
      })
    })
  })
})
