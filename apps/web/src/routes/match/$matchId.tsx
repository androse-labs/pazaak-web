import { createFileRoute } from '@tanstack/react-router'
import { Board } from '../../components/game-elements/Board'
import useWebSocket from 'react-use-websocket'
import { useEffect, useState } from 'react'
import { usePlayer } from '../../contexts/PlayerContext'
import type { CardValue as Card } from '../../components/game-elements/types'

export const Route = createFileRoute('/match/$matchId')({
  component: MatchPage,
})

type PlayerView = {
  matchName: string
  games: {
    boards: [Card[], Card[]]
    turn: number
    winnner: string | null
  }[]
  yourHand: Card[]
  opponentHandSize: number
  round: number
  score: [number, number]
}

function MatchPage() {
  const { matchId } = Route.useParams()
  const { matchConnection } = usePlayer()
  const [gameState, setGameState] = useState<PlayerView | null>(null)

  const { lastJsonMessage } = useWebSocket(
    `ws://localhost:3000/match/${matchId}/subscribe?token=${matchConnection?.token}`,
    {
      retryOnError: true,
      onMessage: (event) => {
        const message = JSON.parse(event.data)
        console.log('WebSocket message received:', message)

        setGameState(message)
      },
    },
  )

  useEffect(() => {
    if (lastJsonMessage !== null) {
      console.log('Received message:', lastJsonMessage)
    }
  }, [lastJsonMessage])

  return (
    <div>
      <h1 className="text-2xl font-bold">Match ID: {matchId}</h1>
      <Board
        board={{
          0: gameState?.games[gameState?.round - 1]?.boards[0] || [],
          1: gameState?.games[gameState?.round - 1]?.boards[1] || [],
        }}
        playerCards={gameState?.yourHand || []}
        opponentCardCount={gameState?.opponentHandSize || 0}
      />
    </div>
  )
}
