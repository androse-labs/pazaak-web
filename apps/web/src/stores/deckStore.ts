import { cardSchema, type Card } from '@pazaak-web/shared'
import { z } from 'zod'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface DeckStore {
  deck: Card[]
  setDeck: (deck: Card[]) => void
}

const demoDeck: Card[] = [
  {
    id: crypto.randomUUID(),
    type: 'tiebreaker',
    value: 1,
    magnitude: 'subtract',
  },
  { id: crypto.randomUUID(), type: 'double', value: 'D' },
  { id: crypto.randomUUID(), type: 'invert', value: '2&4' },
  { id: crypto.randomUUID(), type: 'add', value: 1 },
  { id: crypto.randomUUID(), type: 'add', value: 1 },
  { id: crypto.randomUUID(), type: 'subtract', value: 1 },
  { id: crypto.randomUUID(), type: 'invert', value: '3&6' },
  { id: crypto.randomUUID(), type: 'subtract', value: 3 },
  { id: crypto.randomUUID(), type: 'flip', value: 2, magnitude: 'subtract' },
  { id: crypto.randomUUID(), type: 'tiebreaker', value: 2, magnitude: 'add' },
]

export const deckSchema = z
  .array(cardSchema)
  .refine((deck) => deck.length === 10, {
    message: 'Deck must have exactly 10 cards',
  })
  .refine(
    (deck) => {
      const counts: Record<string, number> = {}
      deck.forEach((card) => {
        const key = [card.type, card.value].join('|')
        counts[key] = (counts[key] || 0) + 1
      })

      return Object.values(counts).every((count) => count <= 2)
    },
    {
      message: 'Deck must have a maximum of 2 any card type',
    },
  )

export const useDeckStore = create<DeckStore>()(
  persist(
    (set) => ({
      deck: demoDeck,
      setDeck: (deck) => set({ deck }),
    }),
    {
      name: 'pazaakDeck',
    },
  ),
)
