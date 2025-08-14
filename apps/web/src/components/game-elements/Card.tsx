import type { CardType } from './types'
import type { Card as CardValue } from '@pazaak-web/shared'
import { useDraggable } from '@dnd-kit/core'
import clsx from 'clsx'

type CardProps = {
  card: CardValue
  disabled?: boolean
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
}

const colorMap: Record<CardType, CardStyle> = {
  none: {
    top: 'bg-pzk-green',
    middle: 'bg-pzk-green',
    bottomLeft: 'bg-pzk-green',
    bottomRight: 'bg-pzk-green',
  },
  add: {
    top: 'bg-pzk-blue',
    middle: 'bg-pzk-blue',
    bottomLeft: 'bg-pzk-blue',
    bottomRight: 'bg-pzk-blue',
  },
  subtract: {
    top: 'bg-pzk-red',
    middle: 'bg-pzk-red',
    bottomLeft: 'bg-pzk-red',
    bottomRight: 'bg-pzk-red',
  },
  invert: {
    top: 'bg-pzk-yellow',
    middle: 'bg-pzk-yellow',
    bottomLeft: 'bg-pzk-yellow',
    bottomRight: 'bg-pzk-yellow',
  },
  flip: {
    top: 'bg-pzk-blue',
    middle: 'bg-pzk-red',
    bottomLeft: 'bg-pzk-red',
    bottomRight: 'bg-pzk-blue',
  },
  double: {
    top: 'bg-pzk-yellow',
    middle: 'bg-pzk-yellow',
    bottomLeft: 'bg-pzk-yellow',
    bottomRight: 'bg-pzk-yellow',
  },
  tiebreaker: {
    top: 'bg-pzk-yellow',
    middle: 'bg-pzk-yellow',
    bottomLeft: 'bg-pzk-yellow',
    bottomRight: 'bg-pzk-yellow',
  },
}

const formatValue = (card: CardValue): string => {
  const { type, value } = card
  switch (type) {
    case 'flip': {
      const sign = card.magnitude === 'subtract' ? '-' : '+'
      return `${sign}${Math.abs(value)}`
    }
    case 'tiebreaker': {
      const sign = card.magnitude === 'subtract' ? '-' : '+'
      return `${sign}${Math.abs(value)}T`
    }
    case 'add':
      if (value === 0) {
        return '0'
      }
      if (value < 0) {
        return `-${Math.abs(value)}`
      }

      return `+${value}`
    case 'subtract':
      if (value === 0) {
        return '0'
      }
      if (value < 0) {
        return `+${Math.abs(value)}`
      }

      return `-${value}`
    case 'double':
    case 'invert':
    default:
      return value.toString()
  }
}

export const Card = ({ card, draggable, disabled = false }: CardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging, over } =
    useDraggable({
      id: card.id,
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
      <div
        className={clsx(
          'select-none',
          { 'cursor-not-allowed': disabled },
          { 'cursor-grab': !disabled },
        )}
      >
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
      className={clsx(
        'select-none',
        { 'cursor-not-allowed': disabled },
        { 'cursor-grab': !disabled },
      )}
    >
      <InnerCard card={card} isShaking={isDragging && over !== null} />
    </div>
  )
}

const InnerCard = ({
  card,
  isShaking,
}: {
  card: CardValue
  isShaking: boolean
}) => {
  const { top, middle, bottomLeft, bottomRight } = colorMap[card.type]

  const isFlipOrTiebreaker = card.type === 'flip' || card.type === 'tiebreaker'

  // swap top and middle based on the magnitude
  const [topColor, middleColor] =
    isFlipOrTiebreaker && card.magnitude === 'subtract'
      ? [middle, top]
      : [top, middle]

  return (
    <div
      className={clsx(
        'aspect-card relative flex h-36 w-24 origin-[50%_35%] flex-col items-center justify-center overflow-hidden rounded-lg bg-gray-300 p-2 shadow-lg',
        { 'animate-slow-shake': isShaking },
      )}
    >
      <div className="flex">
        <div
          className={`${topColor} absolute left-1/2 top-0 h-1/6 w-3/4 -translate-x-1/2 translate-y-1/2 transform rounded-t-lg`}
        />
        <div className="z-1 absolute flex w-3/4 -translate-x-1/2 -translate-y-10 items-center justify-center bg-gray-900 text-2xl font-bold text-white">
          <p>{formatValue(card)}</p>
        </div>
        <div
          className={`${middleColor} absolute left-1/2 h-1/6 w-3/4 -translate-x-1/2 -translate-y-2 transform rounded-b-lg`}
        />
      </div>
      <div
        className={`${bottomLeft} absolute bottom-0 left-1/4 h-1/5 w-9 -translate-x-1/3 transform items-center justify-center rounded-tl-lg`}
      >
        {isFlipOrTiebreaker && (
          <p className="text-center text-2xl font-bold text-black/30">-</p>
        )}
      </div>
      <div
        className={`${bottomRight} absolute bottom-0 right-1/4 h-1/5 w-9 translate-x-1/3 transform items-center justify-center rounded-tr-lg`}
      >
        {isFlipOrTiebreaker && (
          <p className="text-center text-2xl font-bold text-black/30">+</p>
        )}
      </div>
    </div>
  )
}
