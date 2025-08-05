import type { Card } from '@pazaak-web/shared'

const blueCards: Card[] = Array.from({ length: 6 }, (_, i) => ({
  id: `blue-${i + 1}`,
  type: 'add',
  value: i + 1,
}))

const redCards: Card[] = Array.from({ length: 6 }, (_, i) => ({
  id: `red-${i + 1}`,
  type: 'subtract',
  value: -(i + 1),
}))

const flipCards: Card[] = Array.from({ length: 6 }, (_, i) => ({
  id: `invert-${i + 1}`,
  type: 'flip',
  value: i + 1,
  magnitude: 'add',
}))

const invertCards: Card[] = [
  { id: 'invert-24', type: 'invert', value: '2&4' },
  { id: 'invert-36', type: 'invert', value: '3&6' },
]

const tiebreakerCards: Card[] = [
  { id: 'tiebreaker-1', type: 'tiebreaker', value: 1, magnitude: 'add' },
  { id: 'tiebreaker-2', type: 'tiebreaker', value: 2, magnitude: 'add' },
]

const collectionCards: Card[] = [
  ...blueCards,
  ...redCards,
  ...flipCards,
  ...invertCards,
  ...tiebreakerCards,
  { id: 'double-1', type: 'double', value: 'D' },
]

export { collectionCards }
