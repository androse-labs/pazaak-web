import { ScoreDisplay } from './ScoreDisplay'
import { StateDisplay } from './StateDisplay'
import { GridOfItems } from './GridOfItems'
import type { ReactNode } from 'react'

export const OpponentBoardGrid = ({
  title,
  state,
  score,
  total,
  cards,
}: {
  title: string
  theirTurn: boolean
  state: 'playing' | 'standing' | 'busted'
  score: number
  total: number
  cards: ReactNode[]
}) => {
  return (
    <div className="flex flex-row items-start justify-center gap-2">
      <ScoreDisplay total={3} count={score} />
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
    </div>
  )
}
