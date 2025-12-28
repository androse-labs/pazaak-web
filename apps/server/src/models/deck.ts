import { type Card, type MatchType } from '@pazaak-web/shared'

type DeckState = {
  cards: Card[]
}

class Deck {
  cards: Card[] = []

  shuffle(): Deck {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]]
    }
    return this
  }

  defaultFill(matchType: MatchType = 'standard'): Deck {
    if (matchType === 'standard') {
      // Fill the deck with 40 cards: 4 sets of values 1-10 (4 cards of each value)
      this.cards = Array.from({ length: 4 }).flatMap(() =>
        Array.from(
          { length: 10 },
          (_, i) =>
            ({
              id: crypto.randomUUID(),
              type: 'none',
              value: i + 1,
            }) satisfies Card,
        ),
      )
    } else if (matchType === 'exotic') {
      // Fill the deck with exotic cards: higher values and special cards
      // 3 sets of 1-10 (30 cards), plus 10 special cards with values 11-15 (2 of each value)
      this.cards = [
        ...Array.from({ length: 3 }).flatMap(() =>
          Array.from(
            { length: 10 },
            (_, i) =>
              ({
                id: crypto.randomUUID(),
                type: 'none',
                value: i + 1,
              }) satisfies Card,
          ),
        ),
        ...Array.from(
          { length: 10 },
          (_, i) =>
            ({
              id: crypto.randomUUID(),
              type: 'special',
              value: Math.floor(i / 2) + 11, // Values 11-15, 2 of each
            }) satisfies Card,
        ),
      ]
    }

    return this
  }

  fillWithCustomCards(cards: Card[]): Deck {
    this.cards = cards

    return this
  }
}

export { Deck, type DeckState }
