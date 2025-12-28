import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { upgradeWebSocket } from 'hono/bun'
import { MatchActionSchema } from '../models/actions'
import { cardSchema, matchTypeSchema } from '@pazaak-web/shared'
import type { MatchManager } from '../models/match-manager'

export default (matchManager: MatchManager) => {
  const match = new Hono()

  match.post(
    '/match/create',
    zValidator(
      'json',
      z.object({
        deck: z.array(cardSchema),
        matchName: z.string().min(5),
        matchType: matchTypeSchema.default('standard'),
        unlisted: z.boolean(),
      }),
    ),
    async (c) => {
      const { deck, matchName, matchType, unlisted } = c.req.valid('json')

      const { matchId, token, playerId } = matchManager.createMatch(
        matchName,
        matchType,
        unlisted,
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

  match.post(
    '/match/:matchId/join',
    zValidator(
      'json',
      z.object({
        deck: z
          .array(cardSchema)
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

      console.log(
        `Player ${playerId} joined match ${matchId} with token ${token}`,
      )

      return c.json({
        playerId,
        token,
      })
    },
  )

  match.get('/match/joinable', async (c) => {
    const matches = matchManager.getAllMatches()
    if (matches.length === 0) {
      return c.body(null, 204)
    }

    const joinableMatches = matches.filter(
      (match) => !match.players[1] && match.players[0] && !match.unlisted,
    )

    if (joinableMatches.length === 0) {
      return c.body(null, 204)
    }

    return c.json(
      joinableMatches.map((match) => ({
        matchId: match.id,
        matchName: match.matchName,
        matchType: match.matchType,
      })),
    )
  })

  match.get(
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
            ws.close(1404, 'Match not found')
            return
          }

          if (!playerToken) {
            ws.close(1401, 'Token is required')
            return
          }

          const player = match.getPlayerByToken(playerToken)
          if (!player) {
            ws.close(1400, 'Invalid player token')
            return
          }

          match.updatePlayerConnection(player.id, ws)

          console.log(`Player ${player.id} connected to match ${matchId}`)

          match.notifyPlayersAboutGameState()
        },
        onMessage(event) {
          console.log(`Message from client: ${event.data}`)
        },
        onClose: () => {
          // set sendEvent to null to prevent sending messages
          const match = matchManager.getMatch(matchId)
          if (!match) {
            console.log(`Match ${matchId} not found on close`)
            return
          }

          if (!playerToken) {
            console.log('Player token is required on close')
            return
          }

          const player = match.getPlayerByToken(playerToken)

          if (!player) {
            console.log(`Player with token ${playerToken} not found on close`)
            return
          }

          match.clearPlayerConnection(player.id)
          match.notifyPlayersAboutGameState()

          console.log(`Player ${player.id} disconnected from match ${matchId}`)
          // if both players are disconnected and it's been 2 minutes since last activity, delete the match
          if (
            !match.players[0]?.wsConnected &&
            !match.players[1]?.wsConnected &&
            Date.now() - match.lastModifiedDateUtc > 2 * 60 * 1000
          ) {
            const result = matchManager.deleteMatch(matchId)
            if (!result) {
              console.log(`Failed to delete match ${matchId}`)
              return
            }

            console.log(
              `Match ${matchId} ended due to both players disconnecting`,
            )
          }
        },
      }
    }),
  )

  match.patch(
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

      if (!result || result.success === false) {
        return c.json({ error: 'Invalid action' }, 400)
      }

      return c.body(null, 204)
    },
  )

  match.patch(
    '/match/:matchId/rematch',
    zValidator(
      'query',
      z.object({
        token: z.string().min(1),
        action: z.enum(['request', 'accept']),
      }),
    ),
    async (c) => {
      const { matchId } = c.req.param()
      const { token } = c.req.valid('query')

      const match = matchManager.getMatch(matchId)

      if (!match) {
        return c.json({ error: 'Match not found' }, 404)
      }

      const player = match.getPlayerByToken(token)
      if (!player) {
        return c.json({ error: 'Invalid player token' }, 403)
      }

      if (c.req.valid('query').action === 'request') {
        match.requestRematch(player.id)

        return c.body(null, 204)
      } else {
        match.acceptRematch(player.id)

        return c.body(null, 204)
      }
    },
  )
  return match
}
