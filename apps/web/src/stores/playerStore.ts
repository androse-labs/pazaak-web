import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type MatchConnection = {
  matchId: string
  playerId: string
  token: string
}

interface PlayerStore {
  matchConnection: MatchConnection | null
  setMatchConnection: (c: MatchConnection | null) => void
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set) => ({
      matchConnection: null,
      setMatchConnection: (connection) => set({ matchConnection: connection }),
    }),
    {
      name: 'pazaakMatchConnection',
    },
  ),
)
