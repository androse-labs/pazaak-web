import { z } from 'zod'

const cardMagnitudeSchema = z.enum(['subtract', 'add'])

const cardSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.uuid(),
    type: z.literal('double'),
    value: z.literal('D'),
  }),
  z.object({
    id: z.uuid(),
    type: z.literal('special'),
    value: z.number().int(),
  }),
  z.object({
    id: z.uuid(),
    type: z.literal('invert'),
    value: z.templateLiteral([
      z.number().int().positive(),
      '&',
      z.number().int().positive(),
    ]),
  }),
  z.object({
    id: z.uuid(),
    type: z.literal('none'),
    value: z.number().int().positive(),
  }),
  z.object({
    id: z.uuid(),
    type: z.literal('add'),
    value: z.number().int().positive(),
  }),
  z.object({
    id: z.uuid(),
    type: z.literal('subtract'),
    value: z.number().int().positive(),
  }),
  z.object({
    id: z.uuid(),
    type: z.literal('flip'),
    value: z.number().int().positive(),
    magnitude: cardMagnitudeSchema,
  }),
  z.object({
    id: z.uuid(),
    type: z.literal('tiebreaker'),
    value: z.number().int().positive(),
    magnitude: cardMagnitudeSchema,
  }),
])

type Card = z.infer<typeof cardSchema>

const matchTypeSchema = z.enum(['standard', 'exotic'])

type MatchType = z.infer<typeof matchTypeSchema>

export { type Card, cardSchema, type MatchType, matchTypeSchema }
