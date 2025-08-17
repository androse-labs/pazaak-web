import { HiddenHandGrid } from './HiddenHandGrid'
import { GridOfItems } from './GridOfItems'
import { ScoreDisplay } from './ScoreDisplay'
import { StateDisplay } from './StateDisplay'
import type { ReactNode } from 'react'

export const MobileOpponentBoardGrid = ({
  title,
  state,
  score,
  total,
  cards,
  handCount,
}: {
  title: string
  theirTurn: boolean
  state: 'playing' | 'standing' | 'busted'
  score: number
  total: number
  handCount: number
  cards: ReactNode[]
}) => {
  return (
    <div className="flex items-stretch justify-between gap-2">
      <div className="flex flex-col justify-between gap-2">
        <HiddenHandGrid cardCount={handCount} />
        <div className="justify-left flex items-start gap-2">
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
      </div>
      <div className="bg-base-200 relative grid grid-cols-3 grid-rows-3 justify-items-center gap-1 rounded-md p-2 lg:gap-2">
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
