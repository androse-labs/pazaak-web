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
    boards: {
      yourBoard: Card[]
      opponentBoard: Card[]
    }
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

  if (!gameState) {
    return <div>Loading...</div>
  }

  const currentGame = gameState.games[gameState.round - 1]
  const hasStarted = !!currentGame?.boards

  return (
    <div className="flex flex-col items-center justify-center p-5">
      <h1 className="text-2xl font-bold">Match ID: {matchId}</h1>
      {hasStarted ? (
        <Board
          boards={{
            yourBoard: currentGame.boards.yourBoard,
            opponentBoard: currentGame.boards.opponentBoard,
          }}
          playerCards={gameState.yourHand}
          opponentCardCount={gameState.opponentHandSize}
        />
      ) : (
        <div className="text-center text-lg">
          Waiting for the game to start...
        </div>
      )}
    </div>
  )
}
