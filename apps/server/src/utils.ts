import { randomBytes } from 'node:crypto'

export const generateHexToken = (length: number) =>
  Array.from(randomBytes(length), (byte) => (byte % 16).toString(16)).join('')
