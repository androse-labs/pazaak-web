import type { Card } from '@pazaak-web/shared'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface DeckStore {
  deck: Card[]
  setDeck: (deck: Card[]) => void
}

export const useDeckStore = create<DeckStore>()(
  persist(
    (set) => ({
      deck: [],
      setDeck: (deck) => set({ deck }),
    }),
    {
      name: 'pazaakDeck',
    },
  ),
)
