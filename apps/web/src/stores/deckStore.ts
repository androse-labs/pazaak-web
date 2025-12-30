import { cardSchema, type Card } from '@pazaak-web/shared'
import { z } from 'zod'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Deck = {
  id: string
  name: string
  cards: Card[]
}

interface DeckStore {
  decks: Deck[]
  setDeck: (deck: Card[], name: string, id: string) => void
  selectedDeckId: string
  getDeck: (id: string) => Deck | undefined
  getDeckByName: (name: string) => Deck | undefined
  deleteDeck: (id: string) => void
  selectedDeck: () => Deck
  setSelectedDeckId: (id: string) => void
}

const demoDeck: Card[] = [
  {
    id: crypto.randomUUID(),
    type: 'tiebreaker',
    value: 1,
    magnitude: 'add',
  },
  { id: crypto.randomUUID(), type: 'double', value: 'D' },
  { id: crypto.randomUUID(), type: 'invert', value: '2&4' },
  { id: crypto.randomUUID(), type: 'add', value: 1 },
  { id: crypto.randomUUID(), type: 'add', value: 1 },
  { id: crypto.randomUUID(), type: 'subtract', value: 1 },
  { id: crypto.randomUUID(), type: 'invert', value: '3&6' },
  { id: crypto.randomUUID(), type: 'subtract', value: 3 },
  { id: crypto.randomUUID(), type: 'flip', value: 2, magnitude: 'add' },
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
    (set, get) => ({
      decks: [
        { id: 'default', name: 'Default Deck', cards: demoDeck },
        {
          id: 'reversed',
          name: 'Reversed Deck',
          cards: [...demoDeck].reverse(),
        },
      ],
      setDeck: (deck: Card[], name: string, id: string) =>
        set((state) => {
          const decks = [...state.decks]
          const deckIndex = decks.find((d) => d.id === id)
          if (deckIndex) {
            console.log('updating deck', id)
            // update existing deck
            deckIndex.cards = deck
            deckIndex.name = name
          } else {
            // add new deck
            console.log('adding deck', id)
            decks.push({ cards: deck, name, id })
          }

          return { decks }
        }),
      getDeck: (id: string) => {
        return get().decks.find((deck) => deck.id === id)
      },
      getDeckByName: (name: string) => {
        return get().decks.find((deck) => deck.name === name)
      },
      deleteDeck: (id: string) =>
        set((state) => ({
          decks: state.decks.filter((deck) => deck.id !== id),
        })),
      selectedDeckId: 'default',
      setSelectedDeckId: (id: string) =>
        set(() => ({
          selectedDeckId: id,
        })),
      selectedDeck: () => {
        return (
          get().decks.find((deck) => deck.id === get().selectedDeckId) ||
          get().decks[0]
        )
      },
    }),
    {
      name: 'pazaakDeck',
    },
  ),
)
