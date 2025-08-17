import { useState } from 'react'
import { useDroppable, useDndMonitor } from '@dnd-kit/core'
import clsx from 'clsx'
import { GridOfItems } from './GridOfItems'
import { ScoreDisplay } from './ScoreDisplay'
import { StateDisplay } from './StateDisplay'
import type { Card as CardValue } from '@pazaak-web/shared'
import type { ReactNode } from 'react'
import { HandGrid } from './HandGrid'
import { DropOverlay } from '../DropOverlay'

export const MobileYourBoardGrid = ({
  title,
  state,
  score,
  total,
  hand,
  onMagnitudeFlip,
  cards,
}: {
  total: number
  yourTurn: boolean
  score: number
  state: 'playing' | 'standing' | 'busted'
  title: string
  hand: CardValue[]
  onMagnitudeFlip: (cardId: string) => void
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
    <div className="flex items-stretch justify-between gap-2">
      <div className="flex flex-col justify-between gap-2">
        <div className="justify-left flex items-start gap-2">
          <ScoreDisplay total={3} count={score} />
          <div>
            <span className="text-2xl font-bold">{title}</span>
            <div className="text-lg">
              Total: <span className="font-bold">{total}</span>
              <StateDisplay state={state} />
            </div>
          </div>
        </div>
        <HandGrid
          cards={hand}
          onMagnitudeFlip={onMagnitudeFlip}
          yourTurn={true}
        />
      </div>
      <DropOverlay isOver={isOver} show={isDragging} text="Drop to play a card">
        <div
          ref={setNodeRef}
          className={clsx(
            'bg-base-200 relative grid grid-cols-3 grid-rows-3 justify-items-center gap-1 rounded-md p-2 lg:gap-2',
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
