import { PazaakSocketEvent } from '@pazaak-web/shared/src/web-socket-types'
import { ServerWebSocket } from 'bun'
import { randomBytes } from 'crypto'
import { WSContext } from 'hono/ws'

export const generateHexToken = (length: number) =>
  Array.from(randomBytes(length), (byte) => (byte % 16).toString(16)).join('')

export const sendPazaakEvent = (
  connection: WSContext<ServerWebSocket<undefined>>,
  data: PazaakSocketEvent,
) => {
  const message = JSON.stringify(data)
  connection.send(message)
}
