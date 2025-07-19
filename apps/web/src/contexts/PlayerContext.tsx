import { createContext, useContext, useEffect, useState } from 'react'
import type { Card as CardValue } from '@pazaak-web/shared'

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
  const [matchConnection, setMatchConnectionState] =
    useState<MatchConnection | null>(null)

  // Load from localStorage on first mount
  useEffect(() => {
    const saved = localStorage.getItem('matchConnection')
    if (saved) {
      try {
        setMatchConnectionState(JSON.parse(saved))
      } catch {
        localStorage.removeItem('matchConnection') // corrupted data
      }
    }
  }, [])

  const setMatchConnection = (connection: MatchConnection | null) => {
    setMatchConnectionState(connection)
    if (connection) {
      localStorage.setItem('matchConnection', JSON.stringify(connection))
    } else {
      localStorage.removeItem('matchConnection')
    }
  }

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
