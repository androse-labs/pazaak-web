import { createContext, useContext, useState } from 'react'
import type { CardValue } from '../components/game-elements/types'

type MatchConnection = {
  matchId: string
  playerId: string
  token: string
  playerDeck: CardValue[]
}

type PlayerContextType = {
  matchConnection: MatchConnection | null
  setMatchConnection: (connection: MatchConnection | null) => void
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined)

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [matchConnection, setMatchConnection] =
    useState<MatchConnection | null>(null)

  return (
    <PlayerContext.Provider value={{ matchConnection, setMatchConnection }}>
      {children}
    </PlayerContext.Provider>
  )
}

export const usePlayer = () => {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider')
  return ctx
}
