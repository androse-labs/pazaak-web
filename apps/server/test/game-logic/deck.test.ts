import { describe, it, expect } from 'bun:test'
import { Deck } from '../../src/models/deck'

describe('Deck', () => {
  it('creates a standard deck with 40 cards (10 of each value 1-10)', () => {
    const deck = new Deck().defaultFill('standard')

    expect(deck.cards.length).toBe(40)

    // Count cards by value
    const valueCounts: Record<number, number> = {}
    deck.cards.forEach((card) => {
      if (card.type === 'none') {
        valueCounts[card.value] = (valueCounts[card.value] || 0) + 1
      }
    })

    // Each value 1-10 should appear 4 times (4 sets)
    for (let i = 1; i <= 10; i++) {
      expect(valueCounts[i]).toBe(4)
    }
  })

  it('creates an exotic deck with 40 cards including higher value special cards', () => {
    const deck = new Deck().defaultFill('exotic')

    expect(deck.cards.length).toBe(40)

    // Count normal cards and special cards
    let normalCards = 0
    let specialCards = 0
    const specialValueCounts: Record<number, number> = {}

    deck.cards.forEach((card) => {
      if (card.type === 'none') {
        normalCards++
      } else if (card.type === 'special') {
        specialCards++
        specialValueCounts[card.value] = (specialValueCounts[card.value] || 0) + 1
      }
    })

    // 30 normal cards (3 sets of 1-10) + 10 special cards
    expect(normalCards).toBe(30)
    expect(specialCards).toBe(10)

    // Each special value 11-15 should appear exactly 2 times
    for (let i = 11; i <= 15; i++) {
      expect(specialValueCounts[i]).toBe(2)
    }
  })

  it('defaults to standard deck when no type specified', () => {
    const deck = new Deck().defaultFill()

    expect(deck.cards.length).toBe(40)

    // All cards should be type 'none' for standard deck
    const allNone = deck.cards.every((card) => card.type === 'none')
    expect(allNone).toBe(true)
  })

  it('shuffles the deck', () => {
    const deck1 = new Deck().defaultFill('standard')
    const originalOrder = [...deck1.cards]

    deck1.shuffle()

    // After shuffle, order should be different (with very high probability)
    // Check if at least some cards are in different positions
    let differentPositions = 0
    for (let i = 0; i < originalOrder.length; i++) {
      if (originalOrder[i].id !== deck1.cards[i].id) {
        differentPositions++
      }
    }

    expect(differentPositions).toBeGreaterThan(0)
  })
})
