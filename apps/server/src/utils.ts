import { ServerWebSocket } from 'bun'
import { randomBytes } from 'crypto'
import { WSContext } from 'hono/ws'

export const generateHexToken = (length: number) =>
  Array.from(randomBytes(length), (byte) => (byte % 16).toString(16)).join('')

export const sendTypedMessage = <T>(
  connection: WSContext<ServerWebSocket<undefined>>,
  data: T,
) => {
  const message = JSON.stringify(data)
  connection.send(message)
}
