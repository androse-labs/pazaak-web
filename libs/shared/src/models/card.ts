import { z } from 'zod'

const cardMagnitudeSchema = z.enum(['subtract', 'add'])

const CardSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string().uuid(),
    type: z.literal('double'),
    value: z.literal('D'),
  }),
  z.object({
    id: z.string().uuid(),
    type: z.literal('invert'),
    value: z.string().regex(/^\d+&\d+$/), // Matches `${number}&${number}`
  }),
  z.object({
    id: z.string().uuid(),
    type: z.literal('none'),
    value: z.number(),
  }),
  z.object({
    id: z.string().uuid(),
    type: z.literal('add'),
    value: z.number(),
  }),
  z.object({
    id: z.string().uuid(),
    type: z.literal('subtract'),
    value: z.number(),
  }),
  z.object({
    id: z.string().uuid(),
    type: z.literal('flip'),
    value: z.number(),
    magnitude: cardMagnitudeSchema,
  }),
  z.object({
    id: z.string().uuid(),
    type: z.literal('tiebreaker'),
    value: z.number(),
    magnitude: cardMagnitudeSchema,
  }),
])

type Card = z.infer<typeof CardSchema>

export { type Card, CardSchema }
