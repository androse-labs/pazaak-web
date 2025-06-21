import { Children, memo, useState, type ReactNode } from 'react'
import { Card } from './Card'
import { EmptyCard } from './EmptyCard'
import { HiddenCard } from './HiddenCard'
import type { CardValue } from './types'
import { ArrowDownUp, OctagonMinus, SkipForward } from 'lucide-react'
import { DndContext, useDndMonitor, useDroppable } from '@dnd-kit/core'
import clsx from 'clsx'

// Takes either card components or hidden card components and fills the rest
// with empty card components
type GridOfItemsProps = {
  length: number
  children: ReactNode
}

export const GridOfItems: React.FC<GridOfItemsProps> = ({
  length,
  children,
}) => {
  const items = Children.toArray(children)
  return (
    <>
      {Array.from({ length }, (_, index) => {
        return items[index] ?? <EmptyCard key={index} />
      })}
    </>
  )
}

const DropOverlay = ({ isOver }: { isOver: boolean }) => (
  <div
    className={clsx(
      'absolute inset-0 z-10 flex items-center justify-center rounded-md bg-black/40 text-white',
      {
        'backdrop-blur-[2px]': isOver,
      },
    )}
  >
    Drop to play card
  </div>
)

const turnStateString = (
  you: boolean,
  yourTurn: boolean,
  state: 'playing' | 'standing' | 'busted',
): string => {
  if (state === 'busted') {
    return 'Busted'
  }

  if (state === 'standing') {
    return 'Standing'
  }

  if (you) {
    return yourTurn ? 'Your Turn' : ''
  }

  return !yourTurn ? 'Their Turn' : ''
}

const YourBoardGrid = memo(
  ({
    title,
    yourTurn,
    state,
    total,
    cards,
  }: {
    total: number
    yourTurn: boolean
    state: 'playing' | 'standing' | 'busted'
    title: string
    cards: ReactNode[]
  }) => {
    const { setNodeRef, isOver } = useDroppable({ id: 'your-board' })
    const [isDragging, setIsDragging] = useState(false)

    useDndMonitor({
      onDragStart: () => setIsDragging(true),
      onDragEnd: () => setIsDragging(false),
      onDragCancel: () => setIsDragging(false),
    })

    return (
      <div className="flex flex-col items-start justify-center gap-2">
        <div className="flex w-full justify-between">
          <span className="text-2xl font-bold">{title}</span>
          <span className="text-2xl">
            {turnStateString(true, yourTurn, state)}
          </span>
        </div>
        <div className="text-lg">
          Total: <span className="font-bold">{total}</span>
        </div>
        <div
          ref={setNodeRef}
          className={clsx(
            'bg-base-200 relative grid grid-cols-3 grid-rows-3 justify-items-center gap-2 rounded-md p-2',
            { 'outline-neutral outline-4': isOver },
          )}
        >
          <GridOfItems length={9}>
            {cards.map((card, index) => (
              <div key={index} className="h-full w-full">
                {card}
              </div>
            ))}
          </GridOfItems>
          {isDragging && <DropOverlay isOver={isOver} />}
        </div>
      </div>
    )
  },
)

const OpponentBoardGrid = ({
  title,
  theirTurn,
  total,
  cards,
}: {
  title: string
  theirTurn: boolean
  state: 'playing' | 'standing' | 'busted'
  total: number
  cards: ReactNode[]
}) => (
  <div className="flex flex-col items-end justify-end gap-2">
    <div className="flex w-full flex-row-reverse justify-between">
      <span className="text-2xl font-bold">{title}</span>
      <span className="text-2xl">
        {turnStateString(false, !theirTurn, 'playing')}
      </span>
    </div>
    <div className="text-lg">
      Total: <span className="font-bold">{total}</span>
    </div>
    <div className="bg-base-200 relative grid grid-cols-3 grid-rows-3 justify-items-center gap-2 rounded-md p-2">
      <GridOfItems length={9}>
        {cards.map((card, index) => (
          <div key={index} className="h-full w-full">
            {card}
          </div>
        ))}
      </GridOfItems>
    </div>
  </div>
)

const BoardGrid = ({
  title,
  cards,
  isOpponent,
  state,
  total,
  yourTurn,
}: {
  title: string
  state: 'playing' | 'standing' | 'busted'
  cards: ReactNode[]
  total: number
  yourTurn: boolean
  isOpponent?: boolean
}) => {
  if (isOpponent)
    return (
      <OpponentBoardGrid
        title={title}
        state={state}
        cards={cards}
        total={total}
        theirTurn={yourTurn}
      />
    )
  return (
    <YourBoardGrid
      title={title}
      state={state}
      cards={cards}
      total={total}
      yourTurn={yourTurn}
    />
  )
}

const HandGrid = ({
  cards,
  onMagnitudeFlip,
}: {
  cards: CardValue[]
  onMagnitudeFlip: (cardId: string) => void
}) => {
  const { setNodeRef } = useDroppable({
    id: 'hand',
  })

  return (
    <div
      ref={setNodeRef}
      className="bg-base-200 grid w-fit grid-cols-4 grid-rows-1 gap-2 rounded-md p-2"
    >
      <GridOfItems length={4}>
        {cards.map((card, index) => {
          const isConfigurable =
            card.type === 'flip' || card.type === 'tiebreaker'
          return (
            <div key={index} className="flex h-full w-full flex-col gap-2">
              <Card card={card} id={card.id} draggable />
              {isConfigurable && (
                <button
                  className="btn btn-sm btn-neutral w-full"
                  onClick={() => onMagnitudeFlip(card.id)}
                >
                  <ArrowDownUp size={16} />
                  Flip
                </button>
              )}
            </div>
          )
        })}
      </GridOfItems>
    </div>
  )
}

const HiddenHandGrid = ({ cardCount }: { cardCount: number }) => {
  return (
    <div className="bg-base-200 grid w-fit grid-cols-4 grid-rows-1 gap-2 rounded-md p-2">
      <GridOfItems length={4}>
        {Array.from({ length: cardCount }, (_, index) => (
          <div key={index} className="h-full w-full">
            <HiddenCard />
          </div>
        ))}
      </GridOfItems>
    </div>
  )
}

const BoardControls = ({
  onEndTurn,
  onStand,
}: {
  onEndTurn: () => void
  onStand: () => void
}) => (
  <div className="flex gap-2">
    <button
      className="btn btn-secondary flex w-32 items-center justify-center gap-1.5"
      onClick={onStand}
    >
      <OctagonMinus size={20} />
      <span>Stand</span>
    </button>
    <button
      className="btn btn-primary flex w-32 items-center justify-center gap-1.5"
      onClick={onEndTurn}
    >
      <SkipForward size={20} />
      <span>End Turn</span>
    </button>
  </div>
)

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
  yourTurn: boolean
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
  yourTurn,
  yourState,
  opponentState,
  playerCards,
  opponentCardCount,
  onEndTurn,
  onStand,
  onBoardDrop,
  onMagnitudeFlip,
}: BoardProps) => {
  return (
    <div className="flex flex-col items-center justify-center">
      <DndContext
        onDragEnd={(event) => {
          const { active, over } = event
          if (active.data.current && over) {
            if (over.id === 'your-board' && active.data.current.card) {
              onBoardDrop(active.data.current.card as CardValue)
            }
          }
        }}
      >
        <div className="grid w-fit grid-cols-2 grid-rows-1 justify-items-center gap-24 p-5">
          <BoardGrid
            title="You"
            yourTurn={yourTurn}
            state={yourState}
            total={yourBoard.total}
            cards={yourBoard.cards.map((card) => {
              return <Card key={card.id} card={card} id={card.id} />
            })}
          />
          <BoardGrid
            title="Opponent"
            yourTurn={!yourTurn}
            state={opponentState}
            isOpponent
            total={opponentBoard.total}
            cards={opponentBoard.cards.map((card) => {
              return <Card key={card.id} card={card} id={card.id} />
            })}
          />
        </div>
        <div className="grid grid-cols-2 grid-rows-1 gap-2 p-5">
          <HandGrid cards={playerCards} onMagnitudeFlip={onMagnitudeFlip} />
          <HiddenHandGrid cardCount={opponentCardCount} />
        </div>
      </DndContext>
      <BoardControls onStand={onStand} onEndTurn={onEndTurn} />
    </div>
  )
}
