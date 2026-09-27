import { z } from 'zod'

const optionalDateTimeSchema = z.preprocess(
  (val) => (val === '' || val === null ? undefined : val),
  z.string().optional(),
)

export const offerBodySchema = z.object({
  id: z.string().optional(),
  code: z.string().trim().min(2).max(30).transform((v) => v.toUpperCase()),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(500),
  discountType: z.enum(['percentage', 'fixed']).default('percentage'),
  discountValue: z.coerce.number().positive(),
  minOrderAmount: z.coerce.number().nonnegative().default(0),
  startDate: optionalDateTimeSchema,
  endDate: optionalDateTimeSchema,
  isActive: z.boolean().default(true),
  showOnProduct: z.boolean().default(true),
})

export const offerCreateSchema = z.object({
  body: offerBodySchema,
})

export const offerUpdateSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: offerBodySchema.partial(),
})

export const offerIdSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
})

export const offerValidateSchema = z.object({
  body: z.object({
    code: z.string().trim().min(1),
    subtotal: z.coerce.number().nonnegative(),
  }),
})
