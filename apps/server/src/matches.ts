import type { CardValue as Card } from './models.ts'
import { generateHexToken } from './utils.js'
import { HTTPException } from 'hono/http-exception'

type Game = {
  board: Card[]
  deck: Card[]
  matchName: string
  nextPlayer: number
}

type Player = JoinedPlayer | null

type JoinedPlayer = {
  id: string
  token: string
  status: 'playing' | 'standing' | 'busted'
  deck: Card[]
  hand: Card[]
  accessToken: string
}

type Match = {
  id: string
  matchName: string
  games: Game[]
  players: [Player, Player]
}

export class MatchManager {
  private matches: Match[] = []

  createMatch(
    matchName: string,
    deck: Card[],
  ): { matchId: string; playerId: string; token: string } {
    const playerId = crypto.randomUUID()
    const matchId = crypto.randomUUID()
    const token = generateHexToken(16)

    this.matches.push({
      id: matchId,
      matchName,
      games: [],
      players: [
        {
          id: playerId,
          token,
          status: 'playing',
          hand: [],
          deck,
          accessToken: token,
        },
        null, // Second player will join later
      ],
    })

    return { matchId, playerId, token }
  }

  joinMatch(
    matchId: string,
    deck: Card[],
  ): { playerId: string; token: string } | null {
    const match = this.matches.find((m) => m.id === matchId)
    if (!match) return null

    if (match.players[1]) {
      // Match already has two players
      throw new HTTPException(409, { message: 'Match already has two players' })
    }

    const playerId = crypto.randomUUID()
    const token = generateHexToken(16)

    match.players[1] = {
      id: playerId,
      token,
      status: 'playing',
      hand: [],
      deck,
      accessToken: token,
    }

    return { playerId, token }
  }

  getMatch(matchId: string): Match | null {
    return this.matches.find((m) => m.id === matchId) || null
  }

  getAllMatches(): Match[] {
    return this.matches
  }

  deleteMatch(matchId: string): boolean {
    if (this.matches.some((m) => m.id === matchId)) {
      this.matches = this.matches.filter((m) => m.id !== matchId)
      return true
    }
    return false
  }
}
