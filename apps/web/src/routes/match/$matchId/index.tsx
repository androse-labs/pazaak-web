import { createFileRoute } from '@tanstack/react-router'
import { Board } from '../../../components/game-elements/Board'
import useWebSocket from 'react-use-websocket'
import { useEffect, useRef, useState } from 'react'
import type { MatchAction } from '../../../components/game-elements/types'
import { api } from '../../../webClient'
import { useMutation } from '@tanstack/react-query'
import type { Card } from '@pazaak-web/shared'
import type {
  PazaakSocketEvent,
  PlayerView,
} from '@pazaak-web/shared/src/web-socket-types'
import { GameNotification } from '../../../components/GameNotification'
import { usePlayerStore } from '../../../stores/playerStore'
import { CircleX, Crown, Scale } from 'lucide-react'
import { WaitingForMatchToStart } from '../../../components/WaitingForMatchToStart'

export const Route = createFileRoute('/match/$matchId/')({
  component: MatchPage,
})

function hasMagnitude(
  card: Card,
): card is Extract<Card, { magnitude: 'subtract' | 'add' }> {
  return 'magnitude' in card
}

function MatchPage() {
  const { matchId } = Route.useParams()
  const matchConnection = usePlayerStore((s) => s.matchConnection)
  const [gameState, setGameState] = useState<PlayerView | null>(null)
  const [playerHand, setPlayerHand] = useState<Card[]>([])
  const { mutate } = useMutation({
    mutationFn: async (action: MatchAction) =>
      api.patch(
        `${import.meta.env.VITE_API_URL}/match/${matchId}/action`,
        action,
        {
          params: {
            token: matchConnection?.token,
          },
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
  })

  // Notification state
  const [notification, setNotification] = useState<{
    open: boolean
    content: React.ReactNode
    persistent: boolean
  }>({
    open: false,
    content: null,
    persistent: false,
  })
  const notificationTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (notification.open && !notification.persistent) {
      // Set a timeout to close the modal after 2 seconds
      notificationTimeout.current = setTimeout(() => {
        setNotification((n) => ({ ...n, open: false }))
      }, 2000)
    } else {
      // Cleanup timeout if modal is closed or persistent
      if (notificationTimeout.current) {
        clearTimeout(notificationTimeout.current)
        notificationTimeout.current = null
      }
    }
    // Cleanup on unmount
    return () => {
      if (notificationTimeout.current) clearTimeout(notificationTimeout.current)
    }
  }, [notification.open, notification.persistent])

  useWebSocket(
    `${import.meta.env.VITE_API_SOCKET_URL}/match/${matchId}/subscribe?token=${matchConnection?.token}`,
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
        } else if (message.type === 'playerScored') {
          setNotification({
            open: true,
            content: (() => {
              switch (message.who) {
                case 'opponent':
                  return (
                    <div className="flex flex-col items-center gap-2">
                      <CircleX size={24} className="text-red-500" />
                      You loss the round!
                    </div>
                  )
                case 'you':
                  return (
                    <div className="flex flex-col items-center gap-2">
                      <Crown size={24} className="text-yellow-500" />
                      You won the round!
                    </div>
                  )
                case 'no-one':
                  return (
                    <div className="flex flex-col items-center gap-2">
                      <Scale size={24} className="text-blue-500" />
                      Round was a tie! Nobody wins
                    </div>
                  )
              }
            })(),
            persistent: false,
          })
        } else if (message.type === 'matchComplete') {
          setNotification({
            open: true,
            content: (
              <div className="flex flex-col items-center gap-2">
                The match is complete! You
                {message.youWon ? 'won!' : 'lost. Better luck next time!'}
              </div>
            ),
            persistent: false,
          })
        } else {
          console.warn('Unknown message type:', message)
        }
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
      <GameNotification
        id="game-notification"
        open={notification.open}
        persistent={notification.persistent}
      >
        {notification.content}
      </GameNotification>
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
        <WaitingForMatchToStart matchId={matchId} />
      )}
    </div>
  )
}
