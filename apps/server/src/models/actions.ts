import { CardSchema } from '@pazaak-web/shared'
import z from 'zod'

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
