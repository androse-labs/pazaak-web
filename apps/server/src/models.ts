import z from 'zod'

const cardMagnitudeSchema = z.enum(['subtract', 'add'])

export const CardValueSchema = z.discriminatedUnion('type', [
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

export type CardValue = z.infer<typeof CardValueSchema>

export const MatchActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('play'),
    card: CardValueSchema,
  }),
  z.object({
    type: z.literal('end'),
  }),
  z.object({
    type: z.literal('stand'),
  }),
])

export type MatchAction = z.infer<typeof MatchActionSchema>
