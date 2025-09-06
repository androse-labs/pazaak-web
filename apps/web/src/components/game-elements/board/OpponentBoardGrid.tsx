import { ScoreDisplay } from './ScoreDisplay'
import { StateDisplay } from './StateDisplay'
import { GridOfItems } from './GridOfItems'
import { useEffect, useRef, type ReactNode } from 'react'
import { CloudOff } from 'lucide-react'
import { useAudio } from '../../../hooks/useAudio'
import playCardSound from '../../../../assets/sounds/esmDeal03.wav'

export const OpponentBoardGrid = ({
  title,
  state,
  score,
  total,
  connected,
  cards,
}: {
  title: string
  state: 'playing' | 'standing' | 'busted'
  score: number
  connected: boolean
  total: number
  cards: ReactNode[]
}) => {
  const play = useAudio(playCardSound)

  const prevCardCount = useRef(cards.length)

  useEffect(() => {
    if (cards.length > prevCardCount.current) {
      play()
    }
    prevCardCount.current = cards.length
  }, [cards.length, play])

  return (
    <div className="flex flex-row items-start justify-center gap-2">
      <ScoreDisplay total={3} count={score} />
      <div className="flex flex-col items-end justify-end gap-2">
        <div className="flex w-full flex-row-reverse justify-between">
          <div className="flex items-center gap-2">
            {!connected && (
              <CloudOff size={18} strokeWidth={3} className="text-red-300" />
            )}
            <span className="text-2xl font-bold">{title}</span>
          </div>
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
    </div>
  )
}
