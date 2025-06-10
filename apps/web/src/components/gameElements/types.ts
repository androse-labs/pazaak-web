export type CardType =
  | 'none'
  | 'add'
  | 'subtract'
  | 'flip'
  | 'invert'
  | 'double'
  | 'tiebreaker'

// Map CardType to its corresponding value type
type CardValueMap = {
  double: 'D'
  flip: `${number}&${number}`
  none: number
  add: number
  subtract: number
  invert: number
  tiebreaker: number
}

// CardValue is a union over all CardTypes
export type CardValue = {
  [K in CardType]: {
    type: K
    value: CardValueMap[K]
  }
}[CardType]
