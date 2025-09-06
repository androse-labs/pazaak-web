import { useEffect, useRef, useState } from 'react'
import { useDroppable, useDndMonitor } from '@dnd-kit/core'
import clsx from 'clsx'
import { GridOfItems } from './GridOfItems'
import { ScoreDisplay } from './ScoreDisplay'
import { StateDisplay } from './StateDisplay'
import type { ReactNode } from 'react'
import { DropOverlay } from '../DropOverlay'
import { useAudio } from '../../../hooks/useAudio'
import playCardSound from '../../../../assets/sounds/esmDeal03.wav'

export const YourBoardGrid = ({
  title,
  state,
  score,
  total,
  cards,
}: {
  total: number
  score: number
  state: 'playing' | 'standing' | 'busted'
  title: string
  cards: ReactNode[]
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: 'your-board' })
  const [isDragging, setIsDragging] = useState(false)
  const play = useAudio(playCardSound)
  const prevCardCount = useRef(cards.length)

  useDndMonitor({
    onDragStart: () => setIsDragging(true),
    onDragEnd: () => setIsDragging(false),
    onDragCancel: () => setIsDragging(false),
  })

  useEffect(() => {
    if (cards.length > prevCardCount.current) {
      play()
    }
    prevCardCount.current = cards.length
  }, [cards.length, play])

  return (
    <div className="flex flex-row items-start justify-center gap-2">
      <div className="flex flex-col items-start justify-center gap-2">
        <div className="flex w-full justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{title}</span>
          </div>
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
      <ScoreDisplay total={3} count={score} />
    </div>
  )
}
