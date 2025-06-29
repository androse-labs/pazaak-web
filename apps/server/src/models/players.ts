import { ServerWebSocket } from 'bun'
import { WSContext } from 'hono/ws'
import { Card } from './card'
import { Deck } from './deck'

type Player = JoinedPlayer | null

type JoinedPlayer = {
  id: string
  connection: WSContext<ServerWebSocket> | null
  token: string
  status: 'playing' | 'standing' | 'busted'
  deck: Deck
  hand: Card[]
  accessToken: string
}

type PlayerView = {
  matchName: string
  games: {
    boards: {
      yourBoard: { cards: Card[]; total: number }
      opponentBoard: { cards: Card[]; total: number }
    }
    turn: number
    winnner: string | null
  }[]
  yourHand: Card[]
  yourState: 'playing' | 'standing' | 'busted'
  opponentState: 'playing' | 'standing' | 'busted'
  opponentHandSize: number
  yourTurn: boolean
  round: number
  score: [number, number]
}

export type { Player, JoinedPlayer, PlayerView }
