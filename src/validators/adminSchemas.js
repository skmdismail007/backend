import { z } from 'zod'

export const adminIdSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
})

export const adminStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    status: z.enum(['new', 'reviewing', 'contacted', 'completed', 'cancelled']),
  }),
})

export const adminOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
  }),
})

export const adminReviewUpdateSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    isApproved: z.boolean(),
  }),
})
