import z from 'zod'
import { CardSchema } from './card'

const MatchActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('play'),
    card: CardSchema,
  }),
  z.object({
    type: z.literal('end'),
  }),
  z.object({
    type: z.literal('stand'),
  }),
])

type MatchAction = z.infer<typeof MatchActionSchema>

export { MatchAction, MatchActionSchema }
