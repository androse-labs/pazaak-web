import { describe, it, expect } from 'bun:test'
import { decideNextAction, type AiGameView } from '../../src/models/ai-engine'
import { type Card } from '@pazaak-web/shared'

describe('AI Engine — decideNextAction', () => {
  describe('Bust recovery', () => {
    it('plays a fix card when busted', () => {
      const fixCard: Card = { id: 'c1', type: 'subtract', value: 2 }
      const view: AiGameView = {
        myTotal: 22,
        opponentTotal: 15,
        myBoard: [],
        hand: [fixCard],
      }

      expect(decideNextAction(view)).toEqual({ type: 'play', card: fixCard })
    })

    it('picks the fix card closest to 20 when multiple candidates exist', () => {
      // subtract-1 → 21 (still a Bust, filtered), subtract-2 → 20 (best), subtract-3 → 19
      const subtractOne: Card = { id: 'c1', type: 'subtract', value: 1 }
      const subtractTwo: Card = { id: 'c2', type: 'subtract', value: 2 }
      const subtractThree: Card = { id: 'c3', type: 'subtract', value: 3 }
      const view: AiGameView = {
        myTotal: 22,
        opponentTotal: 15,
        myBoard: [],
        hand: [subtractOne, subtractThree, subtractTwo],
      }

      expect(decideNextAction(view)).toEqual({
        type: 'play',
        card: subtractTwo,
      })
    })

    it('ends the turn when no card can fix a Bust', () => {
      const view: AiGameView = {
        myTotal: 22,
        opponentTotal: 15,
        myBoard: [],
        hand: [
          { id: 'c1', type: 'add', value: 1 },
          { id: 'c2', type: 'add', value: 3 },
        ],
      }

      expect(decideNextAction(view)).toEqual({ type: 'end' })
    })
  })

  describe('Perfect score', () => {
    it('stands immediately when board total is exactly 20', () => {
      const view: AiGameView = {
        myTotal: 20,
        opponentTotal: 18,
        myBoard: [],
        hand: [{ id: 'c1', type: 'add', value: 1 }],
      }

      expect(decideNextAction(view)).toEqual({ type: 'stand' })
    })
  })

  describe('Already played a card this Turn', () => {
    it('stands when close to 20 and ahead of the opponent', () => {
      const view: AiGameView = {
        myTotal: 18,
        opponentTotal: 16,
        myBoard: [],
        hand: [{ id: 'c1', type: 'add', value: 1 }],
        hasPlayedThisTurn: true,
      }

      expect(decideNextAction(view)).toEqual({ type: 'stand' })
    })

    it('ends the turn when behind the opponent after playing', () => {
      const view: AiGameView = {
        myTotal: 15,
        opponentTotal: 18,
        myBoard: [],
        hand: [{ id: 'c1', type: 'add', value: 1 }],
        hasPlayedThisTurn: true,
      }

      expect(decideNextAction(view)).toEqual({ type: 'end' })
    })
  })

  describe('Exact 20', () => {
    it('plays a card that brings the total to exactly 20', () => {
      const exactCard: Card = { id: 'c1', type: 'add', value: 3 }
      const view: AiGameView = {
        myTotal: 17,
        opponentTotal: 10,
        myBoard: [],
        hand: [exactCard],
      }

      expect(decideNextAction(view)).toEqual({ type: 'play', card: exactCard })
    })
  })

  describe('Tiebreaker advantage', () => {
    it('plays a Tiebreaker card in a close game when it lands within 3 of 20', () => {
      // myTotal=14, opponentTotal=14 → close game; tiebreaker+3 → 17 (distance 3 ≤ 3)
      // Improving-card path would NOT catch this because distance=3 > 2
      const tiebreakerCard: Card = {
        id: 'c1',
        type: 'tiebreaker',
        value: 3,
        magnitude: 'add',
      }
      const view: AiGameView = {
        myTotal: 14,
        opponentTotal: 14,
        myBoard: [],
        hand: [tiebreakerCard],
      }

      expect(decideNextAction(view)).toEqual({
        type: 'play',
        card: tiebreakerCard,
      })
    })

    it('does not prioritise a Tiebreaker card when the game is not close', () => {
      // myTotal=14, opponentTotal=5 → not close; tiebreaker+3 → 17 (distance 3, not ≤ 2)
      // No improving card and distance (6) > 3, so AI should end the turn
      const tiebreakerCard: Card = {
        id: 'c1',
        type: 'tiebreaker',
        value: 3,
        magnitude: 'add',
      }
      const view: AiGameView = {
        myTotal: 14,
        opponentTotal: 5,
        myBoard: [],
        hand: [tiebreakerCard],
      }

      expect(decideNextAction(view)).toEqual({ type: 'end' })
    })
  })

  describe('Improving card (18–19)', () => {
    it('plays a card that lands the Board on 18', () => {
      const improvingCard: Card = { id: 'c1', type: 'add', value: 2 }
      const view: AiGameView = {
        myTotal: 16,
        opponentTotal: 10,
        myBoard: [],
        hand: [improvingCard],
      }

      expect(decideNextAction(view)).toEqual({
        type: 'play',
        card: improvingCard,
      })
    })
  })

  describe('Stand without playing', () => {
    it('stands when within 3 of 20 and not behind the opponent', () => {
      const view: AiGameView = {
        myTotal: 17,
        opponentTotal: 15,
        myBoard: [],
        hand: [],
      }

      expect(decideNextAction(view)).toEqual({ type: 'stand' })
    })
  })

  describe('End turn', () => {
    it('ends the turn when too far from 20 with no useful hand cards', () => {
      const view: AiGameView = {
        myTotal: 10,
        opponentTotal: 15,
        myBoard: [],
        hand: [],
      }

      expect(decideNextAction(view)).toEqual({ type: 'end' })
    })
  })

  describe('Double card evaluation', () => {
    it('plays a Double card when it copies an Add card and hits exactly 20', () => {
      // Board last card: add-3 → contribution +3; 17+3=20 → exact 20
      const doubleCard: Card = { id: 'c1', type: 'double', value: 'D' }
      const view: AiGameView = {
        myTotal: 17,
        opponentTotal: 12,
        myBoard: [{ id: 'b1', type: 'add', value: 3 }],
        hand: [doubleCard],
      }

      expect(decideNextAction(view)).toEqual({ type: 'play', card: doubleCard })
    })

    it('plays a Double card when it copies a Flip card (add magnitude) into an improving position', () => {
      // Board last card: flip-2 add → contribution +2; 17+2=19 → improving (distance 1 ≤ 2)
      const doubleCard: Card = { id: 'c1', type: 'double', value: 'D' }
      const view: AiGameView = {
        myTotal: 17,
        opponentTotal: 12,
        myBoard: [{ id: 'b1', type: 'flip', value: 2, magnitude: 'add' }],
        hand: [doubleCard],
      }

      expect(decideNextAction(view)).toEqual({ type: 'play', card: doubleCard })
    })

    it('does not play a Double card when copying a Subtract card worsens the total', () => {
      // Board last card: subtract-2 → contribution -2; 18-2=16 (not improving, distance 4 > 2)
      // AI stands on its own: distance 2 ≤ 3 and not behind opponent
      const view: AiGameView = {
        myTotal: 18,
        opponentTotal: 15,
        myBoard: [{ id: 'b1', type: 'subtract', value: 2 }],
        hand: [{ id: 'c1', type: 'double', value: 'D' }],
      }

      expect(decideNextAction(view)).toEqual({ type: 'stand' })
    })

    it('skips a Double card entirely when the last board card is an Invert card', () => {
      // Double is illegal after an Invert → null resultTotal → excluded from candidates
      const view: AiGameView = {
        myTotal: 8,
        opponentTotal: 15,
        myBoard: [{ id: 'b1', type: 'invert', value: '2&4' }],
        hand: [{ id: 'c1', type: 'double', value: 'D' }],
      }

      expect(decideNextAction(view)).toEqual({ type: 'end' })
    })
  })

  describe('Invert card evaluation', () => {
    it('plays an Invert card when it flips a Subtract card into a positive contribution (improving)', () => {
      // Board: none-8, none-6, subtract-4 → myTotal 10
      // Invert '2&4': subtract-4 gets value -4 → computeBoardTotal = 8+6-(-4) = 18; distance 2 ≤ 2 → improving
      const invertCard: Card = { id: 'c1', type: 'invert', value: '2&4' }
      const view: AiGameView = {
        myTotal: 10,
        opponentTotal: 5,
        myBoard: [
          { id: 'b1', type: 'none', value: 8 },
          { id: 'b2', type: 'none', value: 6 },
          { id: 'b3', type: 'subtract', value: 4 },
        ],
        hand: [invertCard],
      }

      expect(decideNextAction(view)).toEqual({ type: 'play', card: invertCard })
    })

    it('plays an Invert card when it flips a Flip card magnitude (subtract → add) into an improving position', () => {
      // Board: none-8, none-6, flip-4 subtract → myTotal 10
      // Invert '2&4': flip-4 magnitude becomes add → computeBoardTotal = 8+6+4 = 18; improving
      const invertCard: Card = { id: 'c1', type: 'invert', value: '2&4' }
      const view: AiGameView = {
        myTotal: 10,
        opponentTotal: 5,
        myBoard: [
          // makeCard('b1', { type: 'none', value: 8 }),
          // makeCard('b2', { type: 'none', value: 6 }),
          // makeCard('b3', { type: 'flip', value: 4, magnitude: 'subtract' }),
          { id: 'b1', type: 'none', value: 8 },
          { id: 'b2', type: 'none', value: 6 },
          { id: 'b3', type: 'flip', value: 4, magnitude: 'subtract' },
        ],
        hand: [invertCard],
      }

      expect(decideNextAction(view)).toEqual({ type: 'play', card: invertCard })
    })

    it('does not play an Invert card when no board cards match its target values', () => {
      // Board: none-7, none-6 → values 7 & 6, neither matches invert targets 2 or 4
      // Invert result = 13 (unchanged); distance 7 > 3 → end
      const view: AiGameView = {
        myTotal: 13,
        opponentTotal: 10,
        myBoard: [
          { id: 'b1', type: 'none', value: 7 },
          { id: 'b2', type: 'none', value: 6 },
        ],
        hand: [{ id: 'c1', type: 'invert', value: '2&4' }],
      }

      expect(decideNextAction(view)).toEqual({ type: 'end' })
    })
  })
})
