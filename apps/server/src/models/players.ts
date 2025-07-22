import { Deck } from './deck'
import { Card } from '@pazaak-web/shared'
import { PazaakSocketEvent } from '@pazaak-web/shared/src/web-socket-types'

type Player = {
  id: string
  wsConnected: boolean
  sendEvent: (event: PazaakSocketEvent) => void
  token: string
  status: 'playing' | 'standing' | 'busted'
  deck: Deck
  hand: Card[]
}

type PlayerView = {
  matchName: string
  games: {
    boards: {
      yourBoard: { cards: Card[]; total: number }
      opponentBoard: { cards: Card[]; total: number }
    }
    turn: number
    winner: string | null
  }[]
  yourHand: Card[]
  yourState: 'playing' | 'standing' | 'busted'
  opponentState: 'playing' | 'standing' | 'busted'
  opponentHandSize: number
  yourTurn: boolean
  round: number
  score: {
    yourScore: number
    opponentScore: number
  }
}

export type { Player, PlayerView }
