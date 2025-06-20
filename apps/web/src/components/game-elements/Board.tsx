import { memo, useState, type JSX } from 'react'
import { Card } from './Card'
import { EmptyCard } from './EmptyCard'
import { HiddenCard } from './HiddenCard'
import type { CardValue } from './types'
import { OctagonMinus, SkipForward } from 'lucide-react'
import { DndContext, useDndMonitor, useDroppable } from '@dnd-kit/core'
import clsx from 'clsx'

type BoardProps = {
  boards: {
    yourBoard: CardValue[]
    opponentBoard: CardValue[]
  }
  playerCards: CardValue[]
  opponentCardCount: number
}

// Takes either card components or hidden card components and fills the rest
// with empty card components
const fitToGrid = (cards: JSX.Element[], length: number): JSX.Element[] => {
  const grid = Array.from({ length }, (_, index) => {
    return cards[index] || <EmptyCard key={index} />
  })
  return grid
}

const DropOverlay = () => (
  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-black/20 text-white">
    Drop to play card
  </div>
)

const YourBoardGrid = memo(
  ({ title, cards }: { title: string; cards: JSX.Element[] }) => {
    const { setNodeRef, isOver } = useDroppable({ id: 'your-board' })
    const [isDragging, setIsDragging] = useState(false)

    useDndMonitor({
      onDragStart: () => setIsDragging(true),
      onDragEnd: () => setIsDragging(false),
      onDragCancel: () => setIsDragging(false),
    })

    return (
      <div className="flex flex-col items-start justify-center gap-2">
        <div className="text-2xl font-bold">{title}</div>
        <div
          ref={setNodeRef}
          className={clsx(
            'bg-base-200 relative grid grid-cols-3 grid-rows-3 justify-items-center gap-2 rounded-md p-2',
            { 'outline-neutral outline-4': isOver },
          )}
        >
          {fitToGrid(cards, 9)}
          {isDragging && <DropOverlay />}
        </div>
      </div>
    )
  },
)

const OpponentBoardGrid = ({
  title,
  cards,
}: {
  title: string
  cards: JSX.Element[]
}) => (
  <div className="flex flex-col items-end justify-end gap-2">
    <div className="text-2xl font-bold">{title}</div>
    <div className="bg-base-200 relative grid grid-cols-3 grid-rows-3 justify-items-center gap-2 rounded-md p-2">
      {fitToGrid(cards, 9)}
    </div>
  </div>
)

const BoardGrid = ({
  title,
  cards,
  isOpponent,
}: {
  title: string
  cards: JSX.Element[]
  isOpponent?: boolean
}) => {
  if (isOpponent) return <OpponentBoardGrid title={title} cards={cards} />
  return <YourBoardGrid title={title} cards={cards} />
}

const HandGrid = ({ cards }: { cards: JSX.Element[] }) => {
  const { setNodeRef } = useDroppable({
    id: 'hand',
  })

  return (
    <div
      ref={setNodeRef}
      className="bg-base-200 grid w-fit grid-cols-4 grid-rows-1 gap-2 rounded-md p-2"
    >
      {fitToGrid(cards, 4)}
    </div>
  )
}

const BoardControls = () => (
  <div className="flex gap-2">
    <button className="btn btn-secondary flex w-32 items-center justify-center gap-1.5">
      <OctagonMinus size={20} />
      <span>Stand</span>
    </button>
    <button className="btn btn-primary flex w-32 items-center justify-center gap-1.5">
      <SkipForward size={20} />
      <span>End Turn</span>
    </button>
  </div>
)

export const Board = ({
  boards: { yourBoard, opponentBoard },
  playerCards,
  opponentCardCount,
}: BoardProps) => {
  return (
    <div className="flex flex-col items-center justify-center">
      <DndContext>
        <div className="grid w-fit grid-cols-2 grid-rows-1 justify-items-center gap-2 p-5">
          <BoardGrid
            title="Your Board"
            cards={yourBoard.map((card) => {
              const id = crypto.randomUUID()
              return <Card key={id} card={card} id={id} />
            })}
          />
          <BoardGrid
            title="Opponent's Board"
            isOpponent
            cards={opponentBoard.map((card) => {
              const id = crypto.randomUUID()
              return <Card key={id} card={card} id={id} />
            })}
          />
        </div>
        <div className="grid grid-cols-2 grid-rows-1 gap-2 p-5">
          <HandGrid
            cards={playerCards.map((card) => {
              const id = crypto.randomUUID()
              return <Card key={id} card={card} id={id} draggable />
            })}
          />
          <HandGrid
            cards={Array.from({ length: opponentCardCount }, (_, index) => (
              <HiddenCard key={index} />
            ))}
          />
        </div>
      </DndContext>
      <BoardControls />
    </div>
  )
}
