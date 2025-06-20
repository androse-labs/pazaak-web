export type CardType = CardValue['type']

// CardValue is a union over all CardTypes
export type CardValue =
  | { id: string; type: 'double'; value: 'D' }
  | { id: string; type: 'invert'; value: `${number}&${number}` }
  | { id: string; type: 'none'; value: number }
  | { id: string; type: 'add'; value: number }
  | { id: string; type: 'subtract'; value: number }
  | { id: string; type: 'flip'; value: number }
  | { id: string; type: 'tiebreaker'; value: number }
