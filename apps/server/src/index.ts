import { websocket } from 'hono/bun'
import { MatchManager } from './models/match-manager'
import { createApp } from './app'

export default {
  port: 3000,
  fetch: createApp(new MatchManager()).fetch,
  websocket,
}

export type AppType = ReturnType<typeof createApp>
