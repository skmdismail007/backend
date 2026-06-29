import { z } from 'zod'

const queryBooleanSchema = z.preprocess(
  (value) => {
    if (value === undefined) return undefined
    return value === true || value === 'true'
  },
  z.boolean().optional(),
)

export const serviceListSchema = z.object({
  query: z.object({
    includeInactive: queryBooleanSchema,
  }),
})

export const serviceIdSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
})

export const serviceCreateSchema = z.object({
  body: z.object({
    id: z.string().min(2).optional(),
    name: z.string().min(2),
    category: z.string().default('Website'),
    price: z.coerce.number().nonnegative(),
    timeline: z.string().optional(),
    description: z.string().min(2),
    image: z.string().optional(),
    deliverables: z.array(z.string()).default([]),
    isActive: z.boolean().default(true),
  }),
})

export const serviceUpdateSchema = serviceCreateSchema.extend({
  params: z.object({
    id: z.string().min(1),
  }),
  body: serviceCreateSchema.shape.body.partial(),
})
