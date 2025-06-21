import { memo } from 'react'
import type { CardType, CardValue } from './types'
import { useDraggable } from '@dnd-kit/core'
import clsx from 'clsx'

type CardProps = {
  card: CardValue
  id: string
  draggable?: boolean
}

type PazaakColor =
  | 'bg-pzk-blue'
  | 'bg-pzk-red'
  | 'bg-pzk-green'
  | 'bg-pzk-yellow'

type CardStyle = {
  top: PazaakColor
  middle: PazaakColor
  bottomLeft: PazaakColor
  bottomRight: PazaakColor
  isFlip: boolean
}

const colorMap: Record<CardType, CardStyle> = {
  none: {
    top: 'bg-pzk-green',
    middle: 'bg-pzk-green',
    bottomLeft: 'bg-pzk-green',
    bottomRight: 'bg-pzk-green',
    isFlip: false,
  },
  add: {
    top: 'bg-pzk-blue',
    middle: 'bg-pzk-blue',
    bottomLeft: 'bg-pzk-blue',
    bottomRight: 'bg-pzk-blue',
    isFlip: false,
  },
  subtract: {
    top: 'bg-pzk-red',
    middle: 'bg-pzk-red',
    bottomLeft: 'bg-pzk-red',
    bottomRight: 'bg-pzk-red',
    isFlip: false,
  },
  invert: {
    top: 'bg-pzk-yellow',
    middle: 'bg-pzk-yellow',
    bottomLeft: 'bg-pzk-yellow',
    bottomRight: 'bg-pzk-yellow',
    isFlip: false,
  },
  flip: {
    top: 'bg-pzk-blue',
    middle: 'bg-pzk-red',
    bottomLeft: 'bg-pzk-red',
    bottomRight: 'bg-pzk-blue',
    isFlip: true,
  },
  double: {
    top: 'bg-pzk-yellow',
    middle: 'bg-pzk-yellow',
    bottomLeft: 'bg-pzk-yellow',
    bottomRight: 'bg-pzk-yellow',
    isFlip: false,
  },
  tiebreaker: {
    top: 'bg-pzk-yellow',
    middle: 'bg-pzk-yellow',
    bottomLeft: 'bg-pzk-yellow',
    bottomRight: 'bg-pzk-yellow',
    isFlip: false,
  },
}

const formatValue = (value: number | string, type: CardType) => {
  switch (type) {
    case 'flip':
      return `±${value}`
    case 'double':
      return value.toString()
    case 'tiebreaker':
      return `±${value}T`
    case 'add':
      return `+${value}`
    case 'subtract':
      return `-${value}`
    case 'invert':
      return value.toString()
    default:
      return value.toString()
  }
}

export const Card = ({ card, id, draggable }: CardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging, over } =
    useDraggable({
      id,
      data: { card },
    })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 20,
      }
    : undefined

  if (!draggable) {
    return (
      <div className="cursor-default select-none">
        <InnerCard card={card} isShaking={false} />
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={clsx('cursor-grab select-none', {})}
    >
      <InnerCard card={card} isShaking={isDragging && over !== null} />
    </div>
  )
}

const InnerCard = memo(
  ({ card, isShaking }: { card: CardValue; isShaking: boolean }) => {
    const cornerStyles = colorMap[card.type]

    return (
      <div
        className={clsx(
          'aspect-card relative flex h-36 w-24 origin-[50%_35%] flex-col items-center justify-center overflow-hidden rounded-lg bg-gray-300 p-2 shadow-lg',
          { 'animate-slow-shake': isShaking },
        )}
      >
        <div className="flex">
          <div
            className={`${cornerStyles.top} absolute left-1/2 top-0 h-1/6 w-3/4 -translate-x-1/2 translate-y-1/2 transform rounded-t-lg`}
          />
          <div className="z-1 absolute flex w-3/4 -translate-x-1/2 -translate-y-10 items-center justify-center bg-gray-900 text-2xl font-bold text-white">
            <p>{formatValue(card.value, card.type)}</p>
          </div>
          <div
            className={`${cornerStyles.middle} absolute left-1/2 h-1/6 w-3/4 -translate-x-1/2 -translate-y-2 transform rounded-b-lg`}
          />
        </div>
        <div
          className={`${cornerStyles.bottomLeft} absolute bottom-0 left-1/4 h-1/5 w-9 -translate-x-1/3 transform items-center justify-center rounded-tl-lg`}
        >
          {cornerStyles.isFlip && (
            <p className="text-center text-2xl font-bold text-black/30">-</p>
          )}
        </div>
        <div
          className={`${cornerStyles.bottomRight} absolute bottom-0 right-1/4 h-1/5 w-9 translate-x-1/3 transform items-center justify-center rounded-tr-lg`}
        >
          {cornerStyles.isFlip && (
            <p className="text-center text-2xl font-bold text-black/30">+</p>
          )}
        </div>
      </div>
    )
  },
)
