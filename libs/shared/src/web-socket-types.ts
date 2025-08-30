import type { Card } from './models/card'

export type PlayerView = {
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
  opponentConnected: boolean
  score: {
    yourScore: number
    opponentScore: number
  }
}

export type PazaakSocketEvent =
  | {
      type: 'matchComplete'
      youWon: boolean
    }
  | {
      type: 'playerScored'
      who: 'you' | 'opponent' | 'no-one'
      yourScore: number
      opponentScore: number
    }
  | ({
      type: 'gameStateUpdate'
    } & PlayerView)
