import { useState, useEffect } from 'react'
import type { Card as CardValue } from '@pazaak-web/shared'
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { BoardControls } from './BoardControls'
import { MobileYourBoardGrid } from './MobileYourBoardGrid'
import { TurnIndicator } from './TurnIndicator'
import { MobileOpponentBoardGrid } from './MobileOpponentBoardGrid'
import { HiddenHandGrid } from './HiddenHandGrid'
import { HandGrid } from './HandGrid'
import { BoardGrid } from './BoardGrid'
import { CardPresentation } from '../card/CardPresentation'

type BoardProps = {
  boards: {
    yourBoard: {
      cards: CardValue[]
      total: number
    }
    opponentBoard: {
      cards: CardValue[]
      total: number
    }
  }
  opponentConnected: boolean
  yourTurn: boolean
  yourScore: number
  opponentScore: number
  yourState: 'playing' | 'standing' | 'busted'
  opponentState: 'playing' | 'standing' | 'busted'
  playerCards: CardValue[]
  opponentCardCount: number
  onEndTurn: () => void
  onStand: () => void
  onBoardDrop: (card: CardValue) => void
  onMagnitudeFlip: (cardId: string) => void
}

export const Board = ({
  boards: { yourBoard, opponentBoard },
  opponentConnected,
  yourScore,
  yourTurn,
  yourState,
  opponentScore,
  opponentState,
  playerCards,
  opponentCardCount,
  onEndTurn,
  onStand,
  onBoardDrop,
  onMagnitudeFlip,
}: BoardProps) => {
  const [draggedCard, setDraggedCard] = useState<CardValue | null>(null)
  const [isShaking, setIsShaking] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 0,
        tolerance: 5,
      },
    }),
    useSensor(MouseSensor),
  )

  useEffect(() => {
    const checkIfDesktop = () => {
      setIsDesktop(window.innerWidth >= 640)
    }
    checkIfDesktop()
    window.addEventListener('resize', checkIfDesktop)

    return () => window.removeEventListener('resize', checkIfDesktop)
  }, [])

  const yourBoardCards = yourBoard.cards.map((card) => (
    <CardPresentation key={card.id} card={card} />
  ))

  const opponentBoardCards = opponentBoard.cards.map((card) => (
    <CardPresentation key={card.id} card={card} />
  ))

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <DndContext
        sensors={sensors}
        onDragStart={(event) => {
          const { active } = event
          if (active.data.current && active.data.current.card) {
            setDraggedCard(active.data.current.card as CardValue)
          }
        }}
        onDragEnd={(event) => {
          const { active, over } = event
          if (active.data.current && over) {
            if (over.id === 'your-board' && active.data.current.card) {
              onBoardDrop(active.data.current.card as CardValue)
            }
          }
          setDraggedCard(null)
        }}
        onDragOver={(event) => {
          const { active, over } = event
          if (over?.id === 'your-board' && active.data.current) {
            setIsShaking(true)
          } else {
            setIsShaking(false)
          }
        }}
      >
        {isDesktop ? (
          // Desktop Layout
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
                <BoardGrid
                  title="You"
                  state={yourState}
                  score={yourScore}
                  total={yourBoard.total}
                  cards={yourBoardCards}
                />
              </div>
              <div className="flex w-48 justify-center">
                <TurnIndicator yourTurn={yourTurn} isDesktop={true} />
              </div>
              <div className="flex-1">
                <BoardGrid
                  title="Opponent"
                  state={opponentState}
                  connected={opponentConnected}
                  score={opponentScore}
                  isOpponent
                  total={opponentBoard.total}
                  cards={opponentBoardCards}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 grid-rows-1 gap-2 p-5">
              <HandGrid
                cards={playerCards}
                onMagnitudeFlip={onMagnitudeFlip}
                yourTurn={yourTurn}
              />
              <HiddenHandGrid cardCount={opponentCardCount} />
            </div>
            <BoardControls
              onStand={onStand}
              onEndTurn={onEndTurn}
              yourTurn={yourTurn}
            />
          </div>
        ) : (
          // Mobile Layout
          <div className="flex h-full w-screen flex-col items-center justify-between gap-4 p-4">
            <div className="flex flex-1 flex-col justify-around gap-2">
              <MobileOpponentBoardGrid
                title="Opponent"
                state={opponentState}
                score={opponentScore}
                total={opponentBoard.total}
                cards={opponentBoardCards}
                handCount={opponentCardCount}
              />
              <div className="flex w-full justify-center">
                <TurnIndicator yourTurn={yourTurn} isDesktop={false} />
              </div>
              <MobileYourBoardGrid
                title="You"
                state={yourState}
                score={yourScore}
                total={yourBoard.total}
                cards={yourBoardCards}
                onMagnitudeFlip={onMagnitudeFlip}
                hand={playerCards}
              />
            </div>
            <BoardControls
              onStand={onStand}
              onEndTurn={onEndTurn}
              yourTurn={yourTurn}
            />
          </div>
        )}

        <DragOverlay dropAnimation={null}>
          {draggedCard && (
            <CardPresentation card={draggedCard} isShaking={isShaking} />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
