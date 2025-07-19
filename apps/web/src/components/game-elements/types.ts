import { type Card } from '@pazaak-web/shared'

export type CardType = Card['type']

export type MatchAction =
  | { type: 'play'; card: Card }
  | { type: 'end' }
  | { type: 'stand' }
