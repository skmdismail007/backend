import { z } from 'zod'

export const reviewCreateSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    project: z.string().min(2),
    rating: z.coerce.number().int().min(1).max(5),
    image: z.string().optional(),
    text: z.string().min(5),
  }),
})

export const contactCreateSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(8),
    subject: z.string().min(2),
    message: z.string().min(5),
  }),
})

export const quoteCreateSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(8),
    items: z.array(
      z.object({
        productId: z.string().optional(),
        name: z.string().min(1),
        quantity: z.coerce.number().int().positive(),
        price: z.coerce.number().nonnegative(),
      }),
    ),
    note: z.string().optional(),
  }),
})
