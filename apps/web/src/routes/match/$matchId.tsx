import { createFileRoute } from '@tanstack/react-router'
import { Board } from '../../components/game-elements/Board'
import useWebSocket from 'react-use-websocket'
import { useState } from 'react'
import { usePlayer } from '../../contexts/PlayerContext'
import type { MatchAction } from '../../components/game-elements/types'
import { api } from '../../webClient'
import { useMutation } from '@tanstack/react-query'
import type { Card } from '@pazaak-web/shared'
import type {
  PazaakSocketEvent,
  PlayerView,
} from '@pazaak-web/shared/src/web-socket-types'

export const Route = createFileRoute('/match/$matchId')({
  component: MatchPage,
})

function hasMagnitude(
  card: Card,
): card is Extract<Card, { magnitude: 'subtract' | 'add' }> {
  return 'magnitude' in card
}

function MatchPage() {
  const { matchId } = Route.useParams()
  const { matchConnection } = usePlayer()
  const [gameState, setGameState] = useState<PlayerView | null>(null)
  const [playerHand, setPlayerHand] = useState<Card[]>([])
  const { mutate } = useMutation({
    mutationFn: async (action: MatchAction) =>
      api.patch(`http://localhost:3000/match/${matchId}/action`, action, {
        params: {
          token: matchConnection?.token,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      }),
  })

  useWebSocket(
    `ws://localhost:3000/match/${matchId}/subscribe?token=${matchConnection?.token}`,
    {
      retryOnError: true,
      onMessage: (event) => {
        const message: PazaakSocketEvent = JSON.parse(event.data)

        if (message.type === 'gameStateUpdate') {
          setGameState(message)

          setPlayerHand((prevHand) =>
            message.yourHand.map((newCard) => {
              const prevCard = prevHand.find((c) => c.id === newCard.id)
              // update the player hand but don't overwrite magnitude for flip or tiebreaker cards
              if (prevCard && hasMagnitude(prevCard) && hasMagnitude(newCard)) {
                return { ...newCard, magnitude: prevCard.magnitude }
              }

              return newCard
            }),
          )
        }

        console.log('Received message:', message)
      },
    },
  )

  const onMagnitudeFlip = (cardId: string) => {
    const card = playerHand.find((c) => c.id === cardId)
    if (!card || !hasMagnitude(card)) return

    const newMagnitude = card.magnitude === 'subtract' ? 'add' : 'subtract'

    setPlayerHand((prevHand) =>
      prevHand.map((card) =>
        card.id === cardId ? { ...card, magnitude: newMagnitude } : card,
      ),
    )
  }

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
          yourScore={gameState.score.yourScore}
          opponentScore={gameState.score.opponentScore}
          yourTurn={gameState.yourTurn}
          yourState={gameState.yourState}
          opponentState={gameState.opponentState}
          playerCards={playerHand}
          opponentCardCount={gameState.opponentHandSize}
          onEndTurn={() => {
            mutate({ type: 'end' })
          }}
          onStand={() => {
            mutate({ type: 'stand' })
          }}
          onBoardDrop={(card: Card) => {
            mutate({
              type: 'play',
              card,
            } as MatchAction)
          }}
          onMagnitudeFlip={onMagnitudeFlip}
        />
      ) : (
        <div className="text-center text-lg">
          Waiting for the game to start...
        </div>
      )}
    </div>
  )
}
