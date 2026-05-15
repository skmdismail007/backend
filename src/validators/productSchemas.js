import { z } from 'zod'

export const productListSchema = z.object({
  query: z.object({
    category: z.string().optional(),
    search: z.string().optional(),
    sort: z.enum(['featured', 'price-low', 'price-high']).optional(),
  }),
})

export const productIdSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
})

export const productCreateSchema = z.object({
  body: z.object({
    id: z.string().min(2).optional(),
    name: z.string().min(2),
    category: z.string().min(2),
    price: z.coerce.number().nonnegative(),
    badge: z.string().optional(),
    image: z.string().optional(),
    short: z.string().min(2),
    details: z.string().min(2),
    specs: z.array(z.string()).default([]),
    includes: z.array(z.string()).default([]),
    isActive: z.boolean().default(true),
  }),
})

export const productUpdateSchema = productCreateSchema.extend({
  params: z.object({
    id: z.string().min(1),
  }),
  body: productCreateSchema.shape.body.partial(),
})
