import { Deck } from './deck'
import { type Card } from '@pazaak-web/shared'
import { type PazaakSocketEvent } from '@pazaak-web/shared/src/web-socket-types'

type Player = {
  id: string
  wsConnected: boolean
  sendEvent: (event: PazaakSocketEvent) => void
  token: string
  status: 'playing' | 'standing' | 'busted'
  deck: Deck
  originalDeck: Card[]
  hand: Card[]
}

export type { Player }
