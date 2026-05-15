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

export const adminUserUpdateSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(8).optional(),
  }),
})

export const adminAddressUpdateSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    fullName: z.string().min(2).optional(),
    phone: z.string().min(8).optional(),
    street: z.string().min(2).optional(),
    city: z.string().min(2).optional(),
    state: z.string().min(2).optional(),
    pinCode: z.string().min(4).optional(),
    addressType: z.enum(['home', 'work', 'other']).optional(),
    isDefault: z.boolean().optional(),
  }),
})

export const adminOrderUpdateSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
    trackingNumber: z.string().min(1).optional(),
    email: z.string().email().optional(),
    total: z.coerce.number().nonnegative().optional(),
  }),
})
