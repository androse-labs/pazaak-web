import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { cors } from 'hono/cors'
import { z } from 'zod'
import { createBunWebSocket } from 'hono/bun'
import { ServerWebSocket } from 'bun'
import { MatchManager } from './models/match-manager'
import { MatchActionSchema } from './models/actions'
import { CardSchema } from '@pazaak-web/shared'
import { sendTypedMessage } from './utils'
import { PazaakSocketEvent } from '@pazaak-web/shared/src/web-socket-types'

const { upgradeWebSocket, websocket } = createBunWebSocket<ServerWebSocket>()

export const createApp = (matchManager: MatchManager) => {
  const app = new Hono({})

  app.use(
    '*',
    cors({
      origin: ['http://localhost:5173'],
    }),
  )

  app.post(
    '/match/create',
    zValidator(
      'json',
      z.object({
        deck: z.array(CardSchema),
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
        deck: z
          .array(CardSchema)
          .min(1, 'Deck must have at least one card')
          .max(10, 'Deck can have a maximum of 10 cards'),
      }),
    ),
    async (c) => {
      const { matchId } = c.req.param()
      const { deck } = c.req.valid('json')

      const result = matchManager.joinMatch(matchId, deck)
      if (!result) {
        return c.json({ error: 'Match not found or invalid deck' }, 400)
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

  app.get(
    '/match/:matchId/subscribe',
    zValidator('query', z.object({ token: z.string().min(1) })),
    upgradeWebSocket((c) => {
      const matchId = c.req.param('matchId')
      const playerToken = c.req.query('token')

      return {
        onOpen: (_event, ws) => {
          console.log(`WebSocket connection opened for match: ${matchId}`)
          const match = matchManager.getMatch(matchId)
          if (!match) {
            ws.close(1000, 'Match not found')
            return
          }

          if (!playerToken) {
            ws.close(1000, 'Token is required')
            return
          }

          const player = match.getPlayerByToken(playerToken)
          if (!player) {
            ws.close(1000, 'Invalid player token')
            return
          }

          match.updatePlayerConnection(player.id, ws)

          console.log(`Player ${player.id} connected to match ${matchId}`)
          sendTypedMessage<PazaakSocketEvent>(ws, {
            type: 'gameStateUpdate',
            ...match.getPlayerView(player.id),
          })
        },
        onMessage(event, _) {
          console.log(`Message from client: ${event.data}`)
        },
        onClose: () => {
          console.log('Connection closed')
        },
      }
    }),
  )

  app.patch(
    '/match/:matchId/action',
    zValidator('json', MatchActionSchema),
    zValidator('query', z.object({ token: z.string().min(1) })),
    async (c) => {
      const { matchId } = c.req.param()
      const action = c.req.valid('json')
      const { token } = c.req.valid('query')

      const match = matchManager.getMatch(matchId)
      if (!match) {
        return c.json({ error: 'Match not found' }, 404)
      }

      const player = match.getPlayerByToken(token)
      if (!player) {
        return c.json({ error: 'Invalid player token' }, 403)
      }

      const result = match.performAction(player.id, action)

      if (!result) {
        return c.json({ error: 'Invalid action' }, 400)
      }

      return c.body(null, 204)
    },
  )

  return app
}

export default {
  port: 3000,
  fetch: createApp(new MatchManager()).fetch,
  websocket,
}

export type AppType = ReturnType<typeof createApp>
