import { z } from 'zod'

const imageReferenceSchema = z.string().trim().min(1)
const optionalMoneySchema = z.preprocess(
  (value) => value === '' || value === null ? undefined : value,
  z.coerce.number().nonnegative().optional(),
)
const offerExpirySchema = z.union([z.string().datetime(), z.literal('')]).optional()
const queryBooleanSchema = z.preprocess(
  (value) => {
    if (value === undefined) return undefined
    return value === true || value === 'true'
  },
  z.boolean().optional(),
)

export const productListSchema = z.object({
  query: z.object({
    category: z.string().optional(),
    search: z.string().optional(),
    sort: z.enum(['featured', 'price-low', 'price-high']).optional(),
    includeInactive: queryBooleanSchema,
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
    oldPrice: optionalMoneySchema,
    offerExpiresAt: offerExpirySchema,
    badge: z.string().optional(),
    image: z.string().optional(),
    images: z.array(imageReferenceSchema).max(10).default([]),
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

export const productImageUploadSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
})

export const productImageDeleteSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  query: z.object({
    imageUrl: imageReferenceSchema,
  }),
})

export const productImageReorderSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    imageUrls: z.array(imageReferenceSchema).min(1).max(10),
  }),
})
