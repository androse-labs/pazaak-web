import { spyOn, describe, it, expect } from 'bun:test'
import { createTestMatch, createTestPlayer } from './match-helper'
import { Game } from '../../src/models/game'
import { type MatchAction } from '../../src/models/actions'
import { type Card } from '@pazaak-web/shared'

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

    expect(state).toMatchObject({
      id: match.id,
      matchName: 'Test Match',
      players: [
        {
          id: 'player1',
          token: 'abc123',
          status: 'playing',
          deck: match.players[0]!.deck,
          hand: [],
          sendEvent: () => {},
        },
        {
          id: 'player2',
          token: 'def456',
          status: 'playing',
          deck: match.players[1]!.deck,
          hand: [],
          sendEvent: () => {},
        },
      ],
      games: [
        {
          winner: null,
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
      connected: {
        you: false,
        opponent: false,
      },
      round: 1,
      score: {
        yourScore: 0,
        opponentScore: 0,
      },
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
      connected: {
        you: false,
        opponent: false,
      },
      round: 1,
      score: {
        yourScore: 0,
        opponentScore: 0,
      },
    })
    expect(player1View).not.toEqual(player2View)
  })

  describe('isActionValid', () => {
    it('allows a valid action', () => {
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

    it("rejects an action when it is not the player's turn", () => {
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
        playerTurn: 2,
      })

      const game = new Game('player1', 'player2')
      match.addGame(game)

      const action: MatchAction = {
        type: 'play',
        card: { id: '1', type: 'flip', value: 5, magnitude: 'subtract' },
      }

      expect(match.isActionValid('player1', action)).toEqual({
        valid: false,
        reason: 'It is not your turn',
      })
    })

    it("rejects an action when the card is not in the player's hand", () => {
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
        playerTurn: 1,
      })

      const game = new Game('player1', 'player2')
      match.addGame(game)

      const action: MatchAction = {
        type: 'play',
        card: { id: '3', type: 'flip', value: 5, magnitude: 'subtract' }, // Not in hand
      }

      expect(match.isActionValid('player1', action)).toEqual({
        valid: false,
        reason: 'Card not found in hand',
      })
    })

    it('rejects an action when there are no cards in hand', () => {
      const match = createTestMatch({
        players: [
          {
            ...createTestPlayer(),
            id: 'player1',
            hand: [],
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
        playerTurn: 1,
      })

      const game = new Game('player1', 'player2')
      match.addGame(game)

      const action: MatchAction = {
        type: 'play',
        card: { id: '3', type: 'flip', value: 5, magnitude: 'subtract' },
      }

      expect(match.isActionValid('player1', action)).toEqual({
        valid: false,
        reason: 'You have no cards in hand',
      })
    })

    it('rejects an action when the match is not in progress', () => {
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
        status: 'waiting',
        playerTurn: 1,
      })

      const game = new Game('player1', 'player2')
      match.addGame(game)

      const action: MatchAction = {
        type: 'play',
        card: { id: '1', type: 'flip', value: 5, magnitude: 'subtract' },
      }

      expect(match.isActionValid('player1', action)).toEqual({
        valid: false,
        reason: 'Match is not in progress',
      })
    })

    it('rejects an action when the player is not part of the match', () => {
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
        playerTurn: 1,
      })

      const game = new Game('player1', 'player2')
      match.addGame(game)

      const action: MatchAction = {
        type: 'play',
        card: { id: '1', type: 'flip', value: 5, magnitude: 'subtract' },
      }

      expect(match.isActionValid('unknownPlayer', action)).toEqual({
        valid: false,
        reason: 'Player not found in match',
      })
    })

    it.each<Card>([
      { id: '5', type: 'double', value: 'D' },
      { id: '4', type: 'invert', value: '2&4' },
    ])(
      'rejects an action to play a double card after a double or invert card',
      (card) => {
        const match = createTestMatch({
          players: [
            {
              ...createTestPlayer(),
              id: 'player1',
              hand: [
                { id: '1', type: 'double', value: 'D' },
                {
                  id: '2',
                  type: 'add',
                  value: 3,
                },
                card,
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
          playerTurn: 1,
        })

        const game = new Game('player1', 'player2')
        game.boards['player1'] = [card]
        match.addGame(game)

        const action: MatchAction = {
          type: 'play',
          card: { id: '1', type: 'double', value: 'D' }, // Trying to play another double
        }

        expect(match.isActionValid('player1', action)).toEqual({
          valid: false,
          reason: 'Cannot play double card after another double or invert card',
        })
      },
    )
  })

  describe('performAction', () => {
    it("plays a card from the player's hand", () => {
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
            hand: [],
          },
        ],
        status: 'in-progress',
      })

      const game = new Game('player1', 'player2')
      match.addGame(game)

      expect(game.boards['player1']).toHaveLength(0)

      const action: MatchAction = {
        type: 'play',
        card: { id: '1', type: 'flip', value: 5, magnitude: 'subtract' },
      }

      expect(match.performAction('player1', action)).toEqual({
        success: true,
      })

      expect(game.boards['player1']).toEqual([
        {
          id: '1',
          type: 'flip',
          value: 5,
          magnitude: 'subtract',
        },
      ])
    })

    it('doubles the value of the last card when playing a double card', () => {
      const match = createTestMatch({
        players: [
          {
            ...createTestPlayer(),
            id: 'player1',
            hand: [
              { id: '1', type: 'flip', value: 5, magnitude: 'subtract' },
              {
                id: '2',
                type: 'double',
                value: 'D',
              },
            ],
          },
          {
            ...createTestPlayer(),
            id: 'player2',
            hand: [],
          },
        ],
        status: 'in-progress',
      })

      const game = new Game('player1', 'player2')
      game.boards['player1'] = [
        { id: '1', type: 'flip', value: 5, magnitude: 'subtract' },
      ]
      match.addGame(game)

      expect(game.boards['player1']).toHaveLength(1)

      const action: MatchAction = {
        type: 'play',
        card: { id: '2', type: 'double', value: 'D' },
      }

      expect(match.performAction('player1', action)).toEqual({
        success: true,
      })

      expect(game.boards['player1']).toEqual([
        {
          id: '1',
          type: 'flip',
          value: 10, // Value doubled
          magnitude: 'subtract',
        },
        {
          id: '2',
          type: 'double',
          value: 'D',
        },
      ])
    })

    it('inverts matching cards when playing an invert card', () => {
      const match = createTestMatch({
        players: [
          {
            ...createTestPlayer(),
            id: 'player1',
            hand: [
              { id: '1', type: 'flip', value: 5, magnitude: 'subtract' },
              {
                id: '2',
                type: 'invert',
                value: '2&4',
              },
            ],
          },
          {
            ...createTestPlayer(),
            id: 'player2',
            hand: [],
          },
        ],
        status: 'in-progress',
      })

      const game = new Game('player1', 'player2')
      game.boards['player1'] = [
        { id: '6', type: 'none', value: 2 },
        { id: '7', type: 'add', value: 4 },
        { id: '8', type: 'none', value: 6 },
      ]
      match.addGame(game)

      expect(game.boards['player1']).toHaveLength(3)

      const action: MatchAction = {
        type: 'play',
        card: { id: '2', type: 'invert', value: '2&4' },
      }

      expect(match.performAction('player1', action)).toEqual({
        success: true,
      })

      expect(game.boards['player1']).toEqual([
        {
          id: '6',
          type: 'none',
          value: -2, // Inverted value
        },
        {
          id: '7',
          type: 'add',
          value: -4, // Inverted value
        },
        {
          id: '8',
          type: 'none',
          value: 6,
        },
        {
          id: '2',
          type: 'invert',
          value: '2&4',
        },
      ])
    })

    it.each<'end' | 'stand'>(['end', 'stand'])(
      "changes the player's turn after a they perform an '%s' action and increments the turn",
      (actionType) => {
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
              hand: [],
            },
          ],
          status: 'in-progress',
        })

        const game = new Game('player1', 'player2')
        match.addGame(game)

        expect(match.playersTurn).toBe(1)
        expect(game.turn).toBe(1)

        expect(match.players[0]!.status).toBe('playing')

        const action: MatchAction = {
          type: actionType,
        }

        expect(match.performAction('player1', action)).toEqual({
          success: true,
        })
        expect(match.playersTurn).toBe(2)
        expect(game.turn).toBe(2)
      },
    )

    it('stays the players turn after they play a card and does not increment the turn', () => {
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
            hand: [],
          },
        ],
        status: 'in-progress',
      })

      const game = new Game('player1', 'player2')
      match.addGame(game)

      expect(match.playersTurn).toBe(1)
      expect(game.turn).toBe(1)

      expect(match.players[0]!.status).toBe('playing')

      const action: MatchAction = {
        type: 'play',
        card: { id: '1', type: 'flip', value: 5, magnitude: 'subtract' },
      }

      expect(match.performAction('player1', action)).toEqual({
        success: true,
      })
      expect(match.playersTurn).toBe(1)
      expect(game.turn).toBe(1)
    })

    it('throws exception when trying to perform an action on a game that does not exist', () => {
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
            hand: [],
          },
        ],
        status: 'in-progress',
      })

      const action: MatchAction = {
        type: 'play',
        card: { id: '1', type: 'flip', value: 5, magnitude: 'subtract' },
      }

      expect(() => match.performAction('player1', action)).toThrow(
        'No current game to perform action in',
      )
    })
  })

  describe('nextTurn', () => {
    it('throws if match is not in progress', () => {
      const match = createTestMatch({ status: 'waiting' })
      expect(() => match.nextTurn()).toThrow('Match is not in progress')
    })

    it('throws if no current game exists', () => {
      const match = createTestMatch({ status: 'in-progress' })
      match.games = []
      expect(() => match.nextTurn()).toThrow(
        'No current game to proceed to the next turn',
      )
    })

    it('advances to next player who is not standing', () => {
      const match = createTestMatch({
        players: [
          { ...createTestPlayer(), id: 'player1', status: 'standing' },
          { ...createTestPlayer(), id: 'player2', status: 'playing' },
        ],
        status: 'in-progress',
        playerTurn: 1,
      })

      const game = new Game('player1', 'player2')
      game.deck.cards = [{ id: 'c1', type: 'add', value: 3 }]
      match.addGame(game)

      match.nextTurn()

      expect(match.playersTurn).toBe(2)
      expect(game.boards['player2']).toEqual([
        { id: 'c1', type: 'add', value: 3 },
      ])
    })

    it('does not draw a card if next player is standing', () => {
      const match = createTestMatch({
        players: [
          { ...createTestPlayer(), id: 'player1', status: 'playing' },
          { ...createTestPlayer(), id: 'player2', status: 'standing' },
        ],
        status: 'in-progress',
        playerTurn: 1,
      })

      const game = new Game('player1', 'player2')
      game.deck.cards = [{ id: '1', type: 'add', value: 3 }]
      match.addGame(game)

      match.nextTurn()

      // Should wrap around to player1, who draws the card
      expect(match.playersTurn).toBe(1)
      expect(game.boards['player1']).toEqual([
        { id: '1', type: 'add', value: 3 },
      ])
    })

    it('throws if no cards are left in the deck', () => {
      const match = createTestMatch({
        players: [
          { ...createTestPlayer(), id: 'player1', status: 'playing' },
          { ...createTestPlayer(), id: 'player2', status: 'standing' },
        ],
        status: 'in-progress',
        playerTurn: 1,
      })

      const game = new Game('player1', 'player2')
      game.deck.cards = []
      match.addGame(game)

      expect(() => match.nextTurn()).toThrow('No cards left in game deck')
    })

    it('calls finalizeGame when all players are standing or busted', () => {
      const match = createTestMatch({
        players: [
          { ...createTestPlayer(), id: 'player1', status: 'standing' },
          { ...createTestPlayer(), id: 'player2', status: 'busted' },
        ],
        status: 'in-progress',
      })

      const game = new Game('player1', 'player2')
      game.deck.cards = [{ id: 'c1', type: 'add', value: 3 }]
      match.addGame(game)
      match.playersTurn = 1

      const spy = spyOn(match, 'finalizeGame')

      match.nextTurn()

      expect(spy).toHaveBeenCalled()
    })

    it('calls notifyPlayersAboutGameState after action', () => {
      const match = createTestMatch({
        players: [
          { ...createTestPlayer(), id: 'player1', status: 'playing' },
          {
            ...createTestPlayer(),
            id: 'player2',
            status: 'playing',
            hand: [{ id: 'c1', type: 'add', value: 3 }],
          },
        ],
        status: 'in-progress',
      })

      const game = new Game('player1', 'player2')
      game.deck.cards = [{ id: 'c1', type: 'add', value: 3 }]
      match.addGame(game)
      match.playersTurn = 2

      const notifySpy = spyOn(match, 'notifyPlayersAboutGameState')

      match.performAction('player2', {
        type: 'play',
        card: { id: 'c1', type: 'add', value: 3 },
      })

      expect(notifySpy).toHaveBeenCalled()
    })
  })

  it('marks the game as complete when a player plays a 9th card and does not bust', () => {
    const match = createTestMatch({
      players: [
        {
          ...createTestPlayer(),
          id: 'player1',
          status: 'playing',
          hand: [{ id: 'test-card-1', type: 'none', value: 1 }],
        },
        { ...createTestPlayer(), id: 'player2', status: 'playing' },
      ],
      status: 'in-progress',
    })

    const game = new Game('player1', 'player2')
    match.addGame(game)

    for (let i = 0; i < 8; i++) {
      game.boards['player1'].push({ id: `card-${i}`, type: 'none', value: 1 })
    }

    expect(game.boards['player1']).toHaveLength(8)
    expect(match.games.length).toBe(1)
    expect(match.score).toEqual([0, 0])
    expect(game.determineTooManyConditionWinner()).toBeNull()

    expect(game.winner).toBeNull()
    expect(match.players[0]!.status).toBe('playing')

    const actionResult = match.performAction('player1', {
      type: 'play',
      card: { id: 'test-card-1', type: 'none', value: 1 },
    })

    expect(actionResult).toEqual({ success: true })
    expect(game.boards['player1']).toHaveLength(9)
    expect(game.determineTooManyConditionWinner()).toBe(0)
    expect(match.games.length).toBe(2)
    expect(match.score).toEqual([1, 0])
  })
})
