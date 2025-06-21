import z from 'zod'

export const CardValueSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('double'),
    value: z.literal('D'),
  }),
  z.object({
    type: z.literal('invert'),
    value: z.string().regex(/^\d+&\d+$/), // Matches `${number}&${number}`
  }),
  z.object({
    type: z.literal('none'),
    value: z.number(),
  }),
  z.object({
    type: z.literal('add'),
    value: z.number(),
  }),
  z.object({
    type: z.literal('subtract'),
    value: z.number(),
  }),
  z.object({
    type: z.literal('flip'),
    value: z.number(),
  }),
  z.object({
    type: z.literal('tiebreaker'),
    value: z.number(),
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
