export type CardType = CardValue['type']

// CardValue is a union over all CardTypes
export type CardValue =
  | { type: 'double'; value: 'D' }
  | { type: 'flip'; value: `${number}&${number}` }
  | { type: 'none'; value: number }
  | { type: 'add'; value: number }
  | { type: 'subtract'; value: number }
  | { type: 'invert'; value: number }
  | { type: 'tiebreaker'; value: number }
