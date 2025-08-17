import clsx from 'clsx'
import { ArrowDownUp } from 'lucide-react'
import type { Card as CardValue } from '@pazaak-web/shared'
import { GridOfItems } from './GridOfItems'
import { Card } from '../card/Card'

export const HandGrid = ({
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
        'bg-base-200 grid w-fit grid-cols-4 grid-rows-1 gap-1 rounded-md p-2 lg:gap-2',
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
