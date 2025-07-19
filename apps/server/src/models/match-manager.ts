import { HTTPException } from 'hono/http-exception'
import { generateHexToken } from '../utils'
import { Match } from './match'
import { Deck } from './deck'
import { Card } from '@pazaak-web/shared'

class MatchManager {
  private matches: Match[] = []

  constructor(matches: Match[] = []) {
    this.matches = matches
  }

  createMatch(
    matchName: string,
    deck: Card[],
  ): { matchId: string; playerId: string; token: string } {
    const playerId = crypto.randomUUID()
    const matchId = crypto.randomUUID()
    const token = generateHexToken(16)

    this.matches.push(
      new Match(matchId, matchName, {
        id: playerId,
        connection: null,
        token,
        status: 'playing',
        deck: new Deck().fillWithCustomCards(deck),
        hand: [],
      }),
    )

    return { matchId, playerId, token }
  }

  joinMatch(
    matchId: string,
    deck: Card[],
  ): { playerId: string; token: string } | null {
    const match = this.matches.find((m) => m.id === matchId)
    if (!match) {
      // Match not found
      throw new HTTPException(404, { message: 'Match not found' })
    }

    if (match.players[1]) {
      // Match already has two players
      throw new HTTPException(409, { message: 'Match already has two players' })
    }

    const playerId = crypto.randomUUID()
    const token = generateHexToken(16)

    match.startMatch({
      id: playerId,
      connection: null,
      token,
      status: 'playing',
      hand: [],
      deck: new Deck().fillWithCustomCards(deck),
    })

    // notify each player about game state
    match.players.forEach((player) => {
      if (player?.connection) {
        player.connection.send(JSON.stringify(match.getPlayerView(player.id)))
      }
    })

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

export { MatchManager }
