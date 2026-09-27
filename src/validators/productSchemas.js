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

const stringOptional = z.preprocess(
  (value) => (value === null || value === undefined ? '' : String(value).trim()),
  z.string().optional().default(''),
)

const productBodySchema = z.object({
  id: z.string().optional(),
  name: z.preprocess(
    (value) => (value === null || value === undefined || String(value).trim() === '' ? 'Untitled Product' : String(value).trim()),
    z.string().optional().default('Untitled Product'),
  ),
  category: z.preprocess(
    (value) => (value === null || value === undefined || String(value).trim() === '' ? 'General' : String(value).trim()),
    z.string().optional().default('General'),
  ),
  brand: stringOptional,
  modelName: stringOptional,
  modelNumber: stringOptional,
  warranty: stringOptional,
  countryOfOrigin: stringOptional,
  weight: stringOptional,
  color: stringOptional,
  material: stringOptional,
  unitCount: stringOptional,
  numberOfItems: stringOptional,
  numberOfPacks: stringOptional,
  importerContact: stringOptional,
  itemTypeName: stringOptional,
  manufacturerPartNumber: stringOptional,
  dimensions: stringOptional,
  itemRank: stringOptional,
  asin: stringOptional,
  price: z.preprocess(
    (value) => {
      if (value === '' || value === null || value === undefined) return 0
      const num = Number(value)
      return Number.isNaN(num) || num < 0 ? 0 : num
    },
    z.number().nonnegative().optional().default(0),
  ),
  oldPrice: optionalMoneySchema,
  offerExpiresAt: offerExpirySchema,
  badge: stringOptional,
  image: stringOptional,
  images: z.array(imageReferenceSchema).max(10).optional(),
  short: stringOptional,
  details: stringOptional,
  specs: z.array(z.string()).optional(),
  includes: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
}).passthrough()

export const productCreateSchema = z.object({
  body: productBodySchema,
})

export const productUpdateSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: productBodySchema.partial().passthrough(),
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
