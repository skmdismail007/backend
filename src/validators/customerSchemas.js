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

export const userRegisterSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
  }),
})

export const userLoginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
})

export const userUpdateSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
  }),
})

export const userIdSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
})

export const addressCreateSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    fullName: z.string().min(2),
    phone: z.string().min(8),
    street: z.string().min(2),
    city: z.string().min(2),
    state: z.string().min(2),
    pinCode: z.string().min(4),
    addressType: z.enum(['home', 'work', 'other']).default('home'),
    isDefault: z.boolean().optional(),
  }),
})

export const addressIdSchema = z.object({
  params: z.object({
    id: z.string().min(1),
    addressId: z.string().min(1),
  }),
})

export const orderCreateSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    items: z.array(
      z.object({
        id: z.string().optional(),
        productId: z.string().optional(),
        name: z.string().min(1),
        quantity: z.coerce.number().int().positive(),
        price: z.coerce.number().nonnegative(),
        image: z.string().optional(),
      }),
    ),
    total: z.coerce.number().nonnegative(),
    address: z.record(z.string(), z.any()),
    email: z.string().email(),
    status: z.string().default('pending'),
    trackingNumber: z.string().optional(),
  }),
})
