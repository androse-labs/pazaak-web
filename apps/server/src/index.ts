import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { CardValueSchema } from './models'
import { MatchManager } from './matches'

export const createApp = (matchManager: MatchManager) => {
  const app = new Hono({})

  app.post(
    '/match/create',
    zValidator(
      'json',
      z.object({
        deck: z.array(CardValueSchema),
        matchName: z.string().min(5),
      }),
    ),
    async (c) => {
      const { deck, matchName } = c.req.valid('json')

      const { matchId, token, playerId } = matchManager.createMatch(
        matchName,
        deck,
      )

      const response = {
        matchId,
        playerId,
        token,
      }

      return c.json(response, 200)
    },
  )

  app.post(
    '/match/:matchId/join',
    zValidator(
      'json',
      z.object({
        deck: z.array(CardValueSchema),
      }),
    ),
    async (c) => {
      const { matchId } = c.req.param()
      const { deck } = c.req.valid('json')

      const result = matchManager.joinMatch(matchId, deck)
      if (!result) {
        return c.json({ error: 'Match not found or invalid deck' }, 404)
      }
      const { playerId, token } = result

      return c.json({
        playerId,
        token,
      })
    },
  )

  app.get('/match/joinable', async (c) => {
    const matches = matchManager.getAllMatches()
    if (matches.length === 0) {
      return c.body(null, 204)
    }

    const joinableMatches = matches.filter(
      (match) => !match.players[1] && match.players[0],
    )

    if (joinableMatches.length === 0) {
      return c.body(null, 204)
    }

    return c.json(
      joinableMatches.map((match) => ({
        matchId: match.id,
        matchName: match.matchName,
      })),
    )
  })

  return app
}

export default createApp
export type AppType = ReturnType<typeof createApp>
