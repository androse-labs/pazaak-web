export type CardType = CardValue['type']

// CardValue is a union over all CardTypes
export type CardValue =
  | { type: 'double'; value: 'D' }
  | { type: 'invert'; value: `${number}&${number}` }
  | { type: 'none'; value: number }
  | { type: 'add'; value: number }
  | { type: 'subtract'; value: number }
  | { type: 'flip'; value: number }
  | { type: 'tiebreaker'; value: number }
