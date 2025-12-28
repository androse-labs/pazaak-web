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
      // Fill the deck with 40 cards, 10 of each type (1-10)
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
      // 3 sets of 1-10, plus 10 special cards with values 11-15
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
              value: 11 + (i % 5), // Values 11-15
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
