import { Card } from '@pazaak-web/shared'

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

  defaultFill(): Deck {
    // Fill the deck with 40 cards, 10 of each type
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

    return this
  }

  fillWithCustomCards(cards: Card[]): Deck {
    this.cards = cards

    return this
  }
}

export { Deck, DeckState }
