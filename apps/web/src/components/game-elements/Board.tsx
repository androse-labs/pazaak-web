import { Children, useState, useEffect, type ReactNode } from 'react'
import { Card, CardPresentation } from './Card'
import { EmptyCard } from './EmptyCard'
import { HiddenCard } from './HiddenCard'
import type { Card as CardValue } from '@pazaak-web/shared'
import {
  ArrowDownUp,
  MoveDown,
  MoveLeft,
  MoveRight,
  MoveUp,
  OctagonMinus,
  OctagonX,
  SkipForward,
} from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  useDndMonitor,
  useDroppable,
} from '@dnd-kit/core'
import clsx from 'clsx'
import { DropOverlay } from './DropOverlay'

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

// Vertical circles indicating games won
// Circle is hollow if no games won
const ScoreDisplay = ({ total, count }: { total: number; count: number }) => {
  return (
    <div className="bg-base-200 flex flex-col-reverse items-center justify-center gap-1 rounded-md p-1 text-lg">
      {Array.from({ length: total }, (_, index) => (
        <div
          key={index}
          className={clsx(
            'h-6 w-6 rounded-full border-2',
            index < count ? 'bg-primary' : 'border-neutral',
          )}
        />
      ))}
    </div>
  )
}

const StateDisplay = ({
  state,
}: {
  state: 'playing' | 'standing' | 'busted'
}) => {
  if (state === 'busted') {
    return (
      <span className="flex items-center gap-2 text-red-300">
        <OctagonX
          size={20}
          strokeWidth={3}
          className="inline-block align-middle leading-none"
        />
        <span className="align-middle text-2xl font-bold leading-none">
          Busted
        </span>
      </span>
    )
  }
  if (state === 'standing') {
    return (
      <span className="flex items-center gap-2 text-yellow-200">
        <OctagonMinus
          size={20}
          strokeWidth={3}
          className="inline-block align-middle leading-none"
        />
        <span className="align-middle text-2xl font-bold leading-none">
          Standing
        </span>
      </span>
    )
  }
  return null
}

const YourBoardGrid = ({
  title,
  state,
  score,
  total,
  cards,
  isDesktop,
}: {
  total: number
  yourTurn: boolean
  score: number
  state: 'playing' | 'standing' | 'busted'
  title: string
  cards: ReactNode[]
  isDesktop: boolean
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: 'your-board' })
  const [isDragging, setIsDragging] = useState(false)

  useDndMonitor({
    onDragStart: () => setIsDragging(true),
    onDragEnd: () => setIsDragging(false),
    onDragCancel: () => setIsDragging(false),
  })

  if (isDesktop) {
    return (
      <div className="flex flex-col items-start justify-center gap-2">
        <div className="flex w-full justify-between">
          <span className="text-2xl font-bold">{title}</span>
          <StateDisplay state={state} />
        </div>
        <div className="text-lg">
          Total: <span className="font-bold">{total}</span>
        </div>
        <DropOverlay
          isOver={isOver}
          show={isDragging}
          text="Drop to play a card"
        >
          <div
            ref={setNodeRef}
            className={clsx(
              'bg-base-200 relative grid grid-cols-3 grid-rows-3 justify-items-center gap-2 rounded-md p-2',
            )}
          >
            <GridOfItems length={9}>
              {cards.map((card, index) => (
                <div key={index} className="h-full w-full">
                  {card}
                </div>
              ))}
            </GridOfItems>
          </div>
        </DropOverlay>
      </div>
    )
  }

  return (
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-start justify-center gap-2">
        <ScoreDisplay total={3} count={score} />
        <div>
          <span className="text-2xl font-bold">{title}</span>
          <div className="text-lg">
            Total: <span className="font-bold">{total}</span>
            <StateDisplay state={state} />
          </div>
        </div>
      </div>
      <DropOverlay isOver={isOver} show={isDragging} text="Drop to play a card">
        <div
          ref={setNodeRef}
          className={clsx(
            'bg-base-200 relative grid grid-cols-3 grid-rows-3 justify-items-center gap-2 rounded-md p-2',
          )}
        >
          <GridOfItems length={9}>
            {cards.map((card, index) => (
              <div key={index} className="h-full w-full">
                {card}
              </div>
            ))}
          </GridOfItems>
        </div>
      </DropOverlay>
    </div>
  )
}

const OpponentBoardGrid = ({
  title,
  state,
  score,
  total,
  cards,
  isDesktop,
}: {
  title: string
  theirTurn: boolean
  state: 'playing' | 'standing' | 'busted'
  score: number
  total: number
  cards: ReactNode[]
  isDesktop: boolean
}) => {
  if (isDesktop) {
    return (
      <div className="flex flex-col items-end justify-end gap-2">
        <div className="flex w-full flex-row-reverse justify-between">
          <span className="text-2xl font-bold">{title}</span>
          <StateDisplay state={state} />
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
  }

  return (
    <div className="flex items-end justify-between gap-2">
      <div className="flex items-end justify-center gap-2">
        <ScoreDisplay total={3} count={score} />
        <div>
          <div className="flex w-full flex-col justify-between">
            <span className="text-2xl font-bold">{title}</span>
          </div>
          <div className="text-lg">
            Total: <span className="font-bold">{total}</span>
            <StateDisplay state={state} />
          </div>
        </div>
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
}

const BoardGrid = ({
  title,
  cards,
  isOpponent,
  state,
  score,
  total,
  yourTurn,
  isDesktop,
}: {
  title: string
  state: 'playing' | 'standing' | 'busted'
  cards: ReactNode[]
  total: number
  score: number
  yourTurn: boolean
  isOpponent?: boolean
  isDesktop: boolean
}) => {
  if (isOpponent)
    return (
      <OpponentBoardGrid
        title={title}
        state={state}
        cards={cards}
        score={score}
        total={total}
        theirTurn={yourTurn}
        isDesktop={isDesktop}
      />
    )
  return (
    <YourBoardGrid
      title={title}
      state={state}
      score={score}
      cards={cards}
      total={total}
      yourTurn={yourTurn}
      isDesktop={isDesktop}
    />
  )
}

const HandGrid = ({
  cards,
  yourTurn,
  onMagnitudeFlip,
}: {
  cards: CardValue[]
  yourTurn: boolean
  onMagnitudeFlip: (cardId: string) => void
}) => {
  return (
    <div
      className={clsx(
        'bg-base-200 grid w-fit grid-cols-4 grid-rows-1 gap-2 rounded-md p-2',
        {
          'cursor-not-allowed': !yourTurn,
          'opacity-50': !yourTurn && cards.length > 0,
        },
      )}
    >
      <GridOfItems length={4}>
        {cards.map((card, index) => {
          const isConfigurable =
            card.type === 'flip' || card.type === 'tiebreaker'
          return (
            <div key={index} className="flex h-full w-full flex-col gap-2">
              <Card card={card} draggable={yourTurn} disabled={!yourTurn} />
              {isConfigurable && (
                <button
                  className="btn btn-xs btn-neutral w-full self-center rounded-md lg:w-full"
                  onClick={() => onMagnitudeFlip(card.id)}
                >
                  <ArrowDownUp size={16} className="hidden lg:inline" />
                  <ArrowDownUp size={14} className="inline lg:hidden" />
                  <span className="hidden lg:inline">Flip</span>
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
  yourTurn,
  onEndTurn,
  onStand,
}: {
  yourTurn: boolean
  onEndTurn: () => void
  onStand: () => void
}) => (
  <div className={clsx('flex gap-2')}>
    <button
      className="btn btn-secondary flex w-32 items-center justify-center gap-1.5"
      onClick={onStand}
      disabled={!yourTurn}
    >
      <OctagonMinus size={20} />
      <span>Stand</span>
    </button>
    <button
      className="btn btn-primary flex w-32 items-center justify-center gap-1.5"
      onClick={onEndTurn}
      disabled={!yourTurn}
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

const TurnIndicator = ({
  yourTurn,
  isDesktop,
}: {
  yourTurn: boolean
  isDesktop: boolean
}) => (
  <div className="text-center text-lg font-bold lg:text-2xl">
    {yourTurn ? (
      <span className="flex flex-row items-center justify-center gap-1 lg:flex-col">
        Your Turn
        {isDesktop ? <MoveLeft size={32} /> : <MoveDown size={20} />}
      </span>
    ) : (
      <span className="flex flex-row items-center justify-center gap-1 lg:flex-col">
        Opponent's Turn
        {isDesktop ? <MoveRight size={32} /> : <MoveUp size={20} />}
      </span>
    )}
  </div>
)

export const Board = ({
  boards: { yourBoard, opponentBoard },
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

  // Use effect to check window size once on mount and whenever window is resized
  useEffect(() => {
    const checkIfDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024) // 1024px is the lg breakpoint in Tailwind
    }

    // Initial check
    checkIfDesktop()

    // Add event listener
    window.addEventListener('resize', checkIfDesktop)

    // Clean up
    return () => window.removeEventListener('resize', checkIfDesktop)
  }, [])

  // Prepare card elements only once
  const yourBoardCards = yourBoard.cards.map((card) => (
    <Card key={card.id} card={card} />
  ))

  const opponentBoardCards = opponentBoard.cards.map((card) => (
    <Card key={card.id} card={card} />
  ))

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <DndContext
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
                  yourTurn={yourTurn}
                  state={yourState}
                  score={yourScore}
                  total={yourBoard.total}
                  cards={yourBoardCards}
                  isDesktop={true}
                />
              </div>
              <div className="flex w-48 justify-center">
                <TurnIndicator yourTurn={yourTurn} isDesktop={true} />
              </div>
              <div className="flex-1">
                <BoardGrid
                  title="Opponent"
                  yourTurn={!yourTurn}
                  state={opponentState}
                  score={opponentScore}
                  isOpponent
                  total={opponentBoard.total}
                  cards={opponentBoardCards}
                  isDesktop={true}
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
          <div className="flex flex-col items-center justify-around gap-2">
            <HiddenHandGrid cardCount={opponentCardCount} />
            <div className="w-100 items-around flex flex-col justify-around gap-4">
              <BoardGrid
                title="Opponent"
                yourTurn={!yourTurn}
                state={opponentState}
                score={opponentScore}
                isOpponent
                total={opponentBoard.total}
                cards={opponentBoardCards}
                isDesktop={false}
              />
              <div className="flex w-full justify-center">
                <TurnIndicator yourTurn={yourTurn} isDesktop={false} />
              </div>
              <BoardGrid
                title="You"
                yourTurn={yourTurn}
                state={yourState}
                score={yourScore}
                total={yourBoard.total}
                cards={yourBoardCards}
                isDesktop={false}
              />
            </div>
            <HandGrid
              cards={playerCards}
              onMagnitudeFlip={onMagnitudeFlip}
              yourTurn={yourTurn}
            />
            <BoardControls
              onStand={onStand}
              onEndTurn={onEndTurn}
              yourTurn={yourTurn}
            />
          </div>
        )}

        <DragOverlay>
          {draggedCard && (
            <CardPresentation card={draggedCard} isShaking={isShaking} />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
