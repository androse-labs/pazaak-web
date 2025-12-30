import { CardPresentation } from './game-elements/card/CardPresentation'
import clsx from 'clsx'
import { Check } from 'lucide-react'
import type { Deck } from '../stores/deckStore'

export const DeckTile = ({
  deck,
  selectedForPlay = false,
  selectedForPreview = false,
  setSelectedForPlay,
  setSelectedForPreview,
}: {
  deck: Deck
  selectedForPlay: boolean
  selectedForPreview: boolean
  setSelectedForPlay: (id: string) => void
  setSelectedForPreview: (id: string) => void
}) => {
  const cards = deck.cards
  const topCards = cards.slice(0, 10)
  const totalSpread = 40
  const mid = (topCards.length - 1) / 2
  const horizontalSpread = 20
  const arcHeight = 10

  const tooltip = selectedForPlay ? 'Selected for Play' : 'Select Deck for Play'

  const a = arcHeight / (mid * mid)

  return (
    <div
      className={clsx(
        'group relative flex flex-col items-center rounded-lg p-4 shadow-lg',
        {
          'bg-base-100': selectedForPreview,
          'bg-base-300': !selectedForPreview,
        },
      )}
    >
      <div
        className="flex h-full w-full flex-col items-center justify-center"
        onClick={() => setSelectedForPreview(deck.id)}
      >
        <div className="flex w-full justify-between">
          <h2 className=" text-lg font-bold">{deck.name}</h2>
          <div className="tooltip tooltip-left" data-tip={tooltip}>
            <button
              className={clsx(
                'btn btn-sm btn-square btn-neutral opacity-0 transition-all group-hover:opacity-100',
                {
                  'btn-ghost text-green-400 opacity-100': selectedForPlay,
                },
              )}
              onClick={(event) => {
                setSelectedForPlay(deck.id)
                event.stopPropagation()
              }}
            >
              <Check />
            </button>
          </div>
        </div>
        <div className="relative flex h-40 w-80 items-center justify-center">
          {topCards.map((card, index) => {
            const rotation =
              ((index - mid) * totalSpread) / (topCards.length - 1)
            const xOffset = (index - mid) * horizontalSpread
            const yOffset = a * Math.pow(index - mid, 2) + arcHeight
            return (
              <div
                key={card.id}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: `${yOffset}px`,
                  zIndex: 100 - index,
                  transform: `translateX(-50%) translateX(${xOffset}px) rotate(${rotation}deg)`,
                }}
              >
                <CardPresentation card={card} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
