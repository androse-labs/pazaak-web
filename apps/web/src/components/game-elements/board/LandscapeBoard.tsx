import { useState } from 'react'
import { useDroppable, useDndMonitor } from '@dnd-kit/core'
import clsx from 'clsx'
import {
  MoveLeft,
  MoveRight,
  OctagonMinus,
  OctagonX,
  SkipForward,
} from 'lucide-react'
import type { ReactNode } from 'react'
import type { Card as CardValue } from '@pazaak-web/shared'
import { GridOfItems } from './GridOfItems'
import { HandGrid } from './HandGrid'
import { HiddenHandGrid } from './HiddenHandGrid'
import { DropOverlay } from '../DropOverlay'

const ScoreDots = ({ count, total = 3 }: { count: number; total?: number }) => (
  <div className="flex shrink-0 flex-row-reverse gap-0.5">
    {Array.from({ length: total }, (_, i) => (
      <div
        key={i}
        className={clsx(
          'h-3 w-3 rounded-full border-2',
          i < count ? 'bg-primary' : 'border-neutral',
        )}
      />
    ))}
  </div>
)

const CompactState = ({
  state,
}: {
  state: 'playing' | 'standing' | 'busted'
}) => {
  if (state === 'busted')
    return (
      <OctagonX size={14} strokeWidth={3} className="shrink-0 text-red-300" />
    )
  if (state === 'standing')
    return (
      <OctagonMinus
        size={14}
        strokeWidth={3}
        className="shrink-0 text-yellow-200"
      />
    )
  return null
}

const LandscapeYourBoard = ({
  title,
  score,
  total,
  state,
  cards,
}: {
  title: string
  score: number
  total: number
  state: 'playing' | 'standing' | 'busted'
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
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <div className="flex min-w-0 items-center gap-1.5 text-sm">
        <ScoreDots count={score} />
        <span className="truncate font-bold">{title}</span>
        <span className="text-base-content/60 shrink-0">{total}</span>
        <CompactState state={state} />
      </div>
      <DropOverlay
        isOver={isOver}
        show={isDragging}
        text="Drop to play"
        className="w-fit"
      >
        <div
          ref={setNodeRef}
          className="bg-base-200 grid w-fit grid-cols-3 grid-rows-3 justify-items-center gap-1 rounded-md p-1"
        >
          <GridOfItems length={9}>{cards}</GridOfItems>
        </div>
      </DropOverlay>
    </div>
  )
}

const LandscapeOpponentBoard = ({
  title,
  score,
  total,
  state,
  cards,
}: {
  title: string
  score: number
  total: number
  state: 'playing' | 'standing' | 'busted'
  cards: ReactNode[]
}) => (
  <div className="flex min-w-0 flex-1 flex-col items-end gap-1">
    <div className="flex min-w-0 items-center gap-1.5 text-sm">
      <CompactState state={state} />
      <span className="text-base-content/60 shrink-0">{total}</span>
      <span className="truncate font-bold">{title}</span>
      <ScoreDots count={score} />
    </div>
    <div className="bg-base-200 grid w-fit grid-cols-3 grid-rows-3 justify-items-center gap-1 rounded-md p-1">
      <GridOfItems length={9}>{cards}</GridOfItems>
    </div>
  </div>
)

type LandscapeBoardProps = {
  yourBoard: { total: number }
  opponentBoard: { total: number }
  yourScore: number
  opponentScore: number
  yourState: 'playing' | 'standing' | 'busted'
  opponentState: 'playing' | 'standing' | 'busted'
  yourTurn: boolean
  playerCards: CardValue[]
  opponentCardCount: number
  yourBoardCards: ReactNode[]
  opponentBoardCards: ReactNode[]
  onEndTurn: () => void
  onStand: () => void
  onMagnitudeFlip: (cardId: string) => void
}

export const LandscapeBoard = ({
  yourBoard,
  opponentBoard,
  yourScore,
  opponentScore,
  yourState,
  opponentState,
  yourTurn,
  playerCards,
  opponentCardCount,
  yourBoardCards,
  opponentBoardCards,
  onEndTurn,
  onStand,
  onMagnitudeFlip,
}: LandscapeBoardProps) => (
  <div className="flex h-full flex-col p-2">
    {/* Two board columns with turn indicator in the middle */}
    <div className="flex shrink-0 gap-2">
      <LandscapeYourBoard
        title="You"
        score={yourScore}
        total={yourBoard.total}
        state={yourState}
        cards={yourBoardCards}
      />

      {/* Turn indicator */}
      <div className="flex w-12 shrink-0 flex-col items-center justify-center gap-1">
        <span className="text-center text-xs leading-tight font-bold">
          {yourTurn ? 'Your Turn' : "Opp's Turn"}
        </span>
        {yourTurn ? <MoveLeft size={20} /> : <MoveRight size={20} />}
      </div>

      <LandscapeOpponentBoard
        title="Opponent"
        score={opponentScore}
        total={opponentBoard.total}
        state={opponentState}
        cards={opponentBoardCards}
      />
    </div>

    {/* Bottom bar: controls + your hand + opponent hidden hand */}
    <div className="flex shrink-0 items-center gap-2">
      <button
        className="btn btn-secondary btn-sm shrink-0"
        onClick={onStand}
        disabled={!yourTurn}
      >
        <OctagonMinus size={16} />
        Stand
      </button>
      <button
        className="btn btn-primary btn-sm shrink-0"
        onClick={onEndTurn}
        disabled={!yourTurn}
      >
        <SkipForward size={16} />
        End Turn
      </button>
      <div className="flex-1" />
      <HandGrid
        cards={playerCards}
        yourTurn={yourTurn}
        onMagnitudeFlip={onMagnitudeFlip}
      />
      <HiddenHandGrid cardCount={opponentCardCount} />
    </div>
  </div>
)
