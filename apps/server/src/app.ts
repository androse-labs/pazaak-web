import { Hono } from 'hono'
import { cors } from 'hono/cors'
import matchRoutes from './routes/match'
import type { MatchManager } from './models/match-manager'
import { logger } from 'hono/logger'

export const createApp = (
  matchManager: MatchManager,
  cleanUpInterval = 10 * 60 * 1000,
) => {
  const app = new Hono()

  app.use(
    '*',
    cors({
      origin: ['http://localhost:5173', 'https://pazaak.androse.dev'],
    }),
  )

  app.use(logger())

  app.route('/', matchRoutes(matchManager))

  setInterval(() => {
    matchManager.cleanUpMatches()
  }, cleanUpInterval)

  return app
}
