import type { JSX } from 'react'
import { Card } from './Card'
import { EmptyCard } from './EmptyCard'
import { HiddenCard } from './HiddenCard'
import type { CardValue } from './types'

type BoardProps = {
  board: Record<string, CardValue[]>
  playerCards: CardValue[]
  opponentCardCount: number
}

// Takes either card components or hidden card components and fills the rest with empty card components
const fitToGrid = (cards: JSX.Element[], length: number): JSX.Element[] => {
  const grid = Array.from({ length }, (_, index) => {
    return cards[index] || <EmptyCard key={index} />
  })
  return grid
}

export const Board = ({
  board,
  playerCards,
  opponentCardCount,
}: BoardProps) => {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="grid w-fit grid-cols-2 grid-rows-1 justify-items-center gap-2 p-5">
        <div className="bg-base-200 grid grid-cols-3 grid-rows-3 justify-items-center gap-2 rounded-md p-2">
          {fitToGrid(
            board[0].map((card, index) => <Card key={index} card={card} />),
            9,
          )}
        </div>
        <div className="bg-base-200 grid grid-cols-3 grid-rows-3 justify-items-center gap-2 rounded-md p-2">
          {fitToGrid(
            board[1].map((card, index) => <Card key={index} card={card} />),
            9,
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 grid-rows-1 gap-2 p-5">
        <div className="bg-base-200 grid w-fit grid-cols-4 grid-rows-1 gap-2 rounded-md p-2">
          {fitToGrid(
            playerCards.map((card, index) => <Card key={index} card={card} />),
            4,
          )}
        </div>
        <div className="bg-base-200 grid w-fit grid-cols-4 grid-rows-1 gap-2 rounded-md p-2">
          {fitToGrid(
            Array.from({ length: opponentCardCount }, (_, index) => (
              <HiddenCard key={index} />
            )),
            4,
          )}
        </div>
      </div>
    </div>
  )
}
