import { Card } from './Card'
import { HiddenCard } from './HiddenCard'
import type { CardValue } from './types'

type BoardProps = {
  playerCards: CardValue[]
  opponentCards: CardValue[]
}

export const Board = ({ playerCards, opponentCards }: BoardProps) => {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="grid w-fit grid-cols-2 grid-rows-1 justify-items-center gap-2 p-5">
        <div className="bg-base-200 grid grid-cols-3 grid-rows-3 justify-items-center gap-2 rounded-md p-2">
          <Card card={{ type: 'double', value: 'D' }} />
          <Card card={{ type: 'flip', value: '2&4' }} />
          <Card card={{ type: 'invert', value: 2 }} />
          <Card card={{ type: 'subtract', value: 3 }} />
          <Card card={{ type: 'none', value: 5 }} />
          <Card card={{ type: 'add', value: 1 }} />
          <Card card={{ type: 'tiebreaker', value: 1 }} />
        </div>
        <div className="bg-base-200 grid grid-cols-3 grid-rows-3 justify-items-center gap-2 rounded-md p-2">
          <Card card={{ type: 'double', value: 'D' }} />
          <Card card={{ type: 'flip', value: '2&4' }} />
          <Card card={{ type: 'invert', value: 2 }} />
          <Card card={{ type: 'subtract', value: 3 }} />
          <Card card={{ type: 'none', value: 5 }} />
          <Card card={{ type: 'add', value: 1 }} />
          <Card card={{ type: 'tiebreaker', value: 1 }} />
        </div>
      </div>
      <div className="grid grid-cols-2 grid-rows-1 gap-2 p-5">
        <div className="bg-base-200 grid w-fit grid-cols-4 grid-rows-1 gap-2 rounded-md p-2">
          {playerCards.map((card, index) => (
            <Card key={index} card={card} />
          ))}
        </div>
        <div className="bg-base-200 grid w-fit grid-cols-4 grid-rows-1 gap-2 rounded-md p-2">
          {opponentCards.map(() => (
            <HiddenCard />
          ))}
        </div>
      </div>
    </div>
  )
}
