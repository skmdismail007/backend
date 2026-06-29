import { z } from 'zod'

const paymentMethodSchema = z.enum(['cod', 'card', 'upi'])
const paymentStatusSchema = z.enum(['pending', 'authorized', 'paid', 'failed'])
const paymentDetailsSchema = z.object({
  method: paymentMethodSchema,
  label: z.string().min(1).optional(),
  status: paymentStatusSchema.optional(),
  amount: z.coerce.number().nonnegative().optional(),
  card: z
    .object({
      cardholder: z.string().min(2).optional(),
      brand: z.string().optional(),
      last4: z.string().regex(/^\d{4}$/).optional(),
    })
    .optional(),
  upi: z
    .object({
      upiId: z.string().min(3).optional(),
    })
    .optional(),
  notes: z.string().max(500).optional(),
})
const siteTextSchema = z.string().max(2000)
const siteImageListSchema = z.array(z.string().trim().min(1).max(2000)).max(5)

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
    payment: paymentDetailsSchema.optional(),
    cancellationReason: z.string().max(500).optional(),
    cancelledBy: z.enum(['user', 'admin']).optional(),
  }),
})

export const adminSiteSettingsSchema = z.object({
  body: z.object({
    heroEyebrow: siteTextSchema.optional(),
    heroTitle: siteTextSchema.optional(),
    heroCopy: siteTextSchema.optional(),
    heroImage: siteTextSchema.optional(),
    heroImages: siteImageListSchema.optional(),
    primaryCtaLabel: siteTextSchema.optional(),
    secondaryCtaLabel: siteTextSchema.optional(),
    featuredTitle: siteTextSchema.optional(),
    servicesTitle: siteTextSchema.optional(),
    testimonialEyebrow: siteTextSchema.optional(),
    testimonialTitle: siteTextSchema.optional(),
    testimonialText: siteTextSchema.optional(),
    testimonialImageOne: siteTextSchema.optional(),
    testimonialImageTwo: siteTextSchema.optional(),
    contactEyebrow: siteTextSchema.optional(),
    contactTitle: siteTextSchema.optional(),
    contactText: siteTextSchema.optional(),
    contactEmail: z.string().email().optional().or(z.literal('')),
    contactPhone: siteTextSchema.optional(),
  }),
})
