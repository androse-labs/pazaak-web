import { forwardRef } from 'react'
import clsx from 'clsx'
import type { Card as CardValue } from '@pazaak-web/shared'
import type { CardType } from '../types'

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

export const CardPresentation = forwardRef<
  HTMLDivElement,
  { card: CardValue; isShaking?: boolean }
>(({ card, isShaking = false }, ref) => {
  const { top, middle, bottomLeft, bottomRight } = colorMap[card.type]

  const isFlipOrTiebreaker = card.type === 'flip' || card.type === 'tiebreaker'

  // swap top and middle based on the magnitude
  const [topColor, middleColor] =
    isFlipOrTiebreaker && card.magnitude === 'subtract'
      ? [middle, top]
      : [top, middle]

  return (
    <div
      ref={ref}
      className={clsx(
        'grid aspect-[2/3] w-10 grid-rows-[0.5fr_4fr_1.5fr_1.5fr] overflow-hidden rounded-sm bg-gray-300 px-1 text-center text-xs font-bold shadow-lg lg:w-20 lg:rounded-lg lg:px-3 lg:text-xl',
        { 'animate-slow-shake': isShaking },
      )}
    >
      <div></div>

      {/* Middle section */}
      <div className="flex h-full w-full flex-col items-center justify-center">
        <div
          className={`${topColor} h-full w-full justify-self-center rounded-t-sm lg:rounded-t-lg`}
        />
        <div className=" h-full w-full bg-gray-900 text-white ">
          {formatValue(card)}
        </div>
        <div
          className={`${middleColor} h-full w-full self-end justify-self-center rounded-b-sm lg:rounded-b-lg`}
        />
      </div>

      <div></div>

      {/* Bottom section */}
      <div className="grid grid-cols-2">
        <div
          className={`${bottomLeft} flex h-full w-full items-center justify-center rounded-tl-sm lg:rounded-tl-lg`}
        >
          {isFlipOrTiebreaker && (
            <p className="hidden text-black/30 lg:block">+</p>
          )}
        </div>
        <div
          className={`${bottomRight} flex h-full w-full items-center justify-center rounded-tr-sm lg:rounded-tr-lg`}
        >
          {isFlipOrTiebreaker && (
            <p className="hidden text-black/30 lg:block">+</p>
          )}
        </div>
      </div>
    </div>
  )
})
