import mongoose from 'mongoose'

const { Schema } = mongoose

const stringList = { type: [String], default: [] }
const mixedObject = { type: Schema.Types.Mixed, default: undefined }

function createSchema(definition) {
  return new Schema(
    {
      _id: { type: String, required: true },
      id: { type: String },
      ...definition,
      createdAt: { type: String },
      updatedAt: { type: String },
    },
    {
      id: false,
      bufferCommands: false,
      minimize: false,
      strict: false,
      versionKey: false,
    },
  )
}

const paymentCardSchema = new Schema(
  {
    cardholder: String,
    brand: String,
    last4: String,
  },
  { _id: false, id: false, strict: false, versionKey: false },
)

const paymentUpiSchema = new Schema(
  {
    upiId: String,
  },
  { _id: false, id: false, strict: false, versionKey: false },
)

const paymentSchema = new Schema(
  {
    method: String,
    label: String,
    status: String,
    amount: Number,
    card: paymentCardSchema,
    upi: paymentUpiSchema,
    notes: String,
  },
  { _id: false, id: false, strict: false, versionKey: false },
)

const orderItemSchema = new Schema(
  {
    id: String,
    productId: String,
    name: String,
    quantity: Number,
    price: Number,
    image: String,
  },
  { _id: false, id: false, strict: false, versionKey: false },
)

const productSchema = createSchema({
  name: String,
  category: String,
  price: Number,
  oldPrice: Number,
  offerExpiresAt: Date,
  stock: Number,
  badge: String,
  image: String,
  images: stringList,
  short: String,
  details: String,
  description: String,
  specs: stringList,
  includes: stringList,
  isActive: { type: Boolean, default: true },
})
productSchema.index({ isActive: 1, category: 1 })
productSchema.index({ createdAt: -1 })

const serviceSchema = createSchema({
  name: String,
  category: String,
  price: Number,
  timeline: String,
  description: String,
  summary: String,
  image: String,
  deliverables: stringList,
  isActive: { type: Boolean, default: true },
})
serviceSchema.index({ isActive: 1, category: 1 })
serviceSchema.index({ createdAt: -1 })

const reviewSchema = createSchema({
  name: String,
  project: String,
  rating: Number,
  image: String,
  text: String,
  isApproved: { type: Boolean, default: true },
})
reviewSchema.index({ isApproved: 1, createdAt: -1 })

const contactMessageSchema = createSchema({
  name: String,
  email: String,
  phone: String,
  subject: String,
  message: String,
  status: { type: String, default: 'new' },
})
contactMessageSchema.index({ status: 1, createdAt: -1 })

const quoteRequestSchema = createSchema({
  name: String,
  email: String,
  phone: String,
  note: String,
  items: { type: [orderItemSchema], default: [] },
  status: { type: String, default: 'new' },
})
quoteRequestSchema.index({ status: 1, createdAt: -1 })

const userSchema = createSchema({
  name: String,
  email: { type: String, lowercase: true, trim: true },
  password: String,
  phone: String,
})
userSchema.index({ email: 1 }, { unique: true, sparse: true })
userSchema.index({ createdAt: -1 })

const addressSchema = createSchema({
  userId: String,
  fullName: String,
  phone: String,
  street: String,
  city: String,
  state: String,
  pinCode: String,
  addressType: String,
  isDefault: { type: Boolean, default: false },
})
addressSchema.index({ userId: 1, isDefault: 1 })
addressSchema.index({ createdAt: -1 })

const orderSchema = createSchema({
  userId: String,
  status: { type: String, default: 'pending' },
  trackingNumber: String,
  items: { type: [orderItemSchema], default: [] },
  total: Number,
  address: mixedObject,
  payment: paymentSchema,
  email: String,
  cancellationReason: String,
  cancelledBy: String,
  cancelledAt: String,
})
orderSchema.index({ userId: 1, createdAt: -1 })
orderSchema.index({ status: 1, createdAt: -1 })

const siteSettingsSchema = createSchema({
  logoUrl: String,
  heroEyebrow: String,
  heroTitle: String,
  heroCopy: String,
  heroImage: String,
  heroImages: stringList,
  primaryCtaLabel: String,
  secondaryCtaLabel: String,
  featuredTitle: String,
  servicesTitle: String,
  testimonialEyebrow: String,
  testimonialTitle: String,
  testimonialText: String,
  testimonialImageOne: String,
  testimonialImageTwo: String,
  contactEyebrow: String,
  contactTitle: String,
  contactText: String,
  contactEmail: String,
  contactPhone: String,
  contactAddress: String,
  businessHours: String,
  contactServiceAreas: { type: [String], default: [] },
  freelanceHeroTitle: String,
  freelanceHeroText: String,
  freelanceHeroImage: String,
  productsHeroEyebrow: String,
  productsHeroTitle: String,
  productsHeroText: String,
  productsHeroImage: String,
  servicesHeroEyebrow: String,
  servicesHeroTitle: String,
  servicesHeroText: String,
  servicesHeroImage: String,
  reviewsHeroEyebrow: String,
  reviewsHeroTitle: String,
  reviewsHeroText: String,
  reviewsHeroImage: String,
  contactHeroTitle: String,
  contactHeroText: String,
  footerDescription: String,
})

const adminSchema = createSchema({
  uid: String,
  email: String,
  role: String,
  active: { type: Boolean, default: true },
})
adminSchema.index({ uid: 1 }, { unique: true, sparse: true })
adminSchema.index({ email: 1 }, { sparse: true })

const categorySchema = createSchema({
  name: String,
  slug: String,
  type: String,
  description: String,
  image: String,
  sortOrder: Number,
  isActive: { type: Boolean, default: true },
})
categorySchema.index({ type: 1, isActive: 1, sortOrder: 1 })
categorySchema.index({ slug: 1 }, { unique: true, sparse: true })

const bannerSchema = createSchema({
  title: String,
  subtitle: String,
  image: String,
  linkLabel: String,
  linkUrl: String,
  placement: String,
  sortOrder: Number,
  isActive: { type: Boolean, default: true },
})
bannerSchema.index({ placement: 1, isActive: 1, sortOrder: 1 })

const blogPostSchema = createSchema({
  title: String,
  slug: String,
  excerpt: String,
  content: String,
  image: String,
  author: String,
  tags: stringList,
  published: { type: Boolean, default: false },
  publishedAt: String,
})
blogPostSchema.index({ slug: 1 }, { unique: true, sparse: true })
blogPostSchema.index({ published: 1, createdAt: -1 })
blogPostSchema.index({ tags: 1 })

const freelanceRequestSchema = createSchema({
  name: String,
  email: String,
  phone: String,
  projectType: String,
  projectDescription: String,
  budget: String,
  timeline: String,
  status: { type: String, default: 'new' },
})
freelanceRequestSchema.index({ status: 1, createdAt: -1 })

function model(name, schema, collection) {
  return mongoose.models[name] || mongoose.model(name, schema, collection)
}

const collectionModels = {
  products: model('Product', productSchema, 'products'),
  services: model('ServiceOffering', serviceSchema, 'services'),
  reviews: model('Review', reviewSchema, 'reviews'),
  contactMessages: model('ContactMessage', contactMessageSchema, 'contactMessages'),
  quoteRequests: model('QuoteRequest', quoteRequestSchema, 'quoteRequests'),
  users: model('CustomerUser', userSchema, 'users'),
  addresses: model('Address', addressSchema, 'addresses'),
  orders: model('Order', orderSchema, 'orders'),
  siteSettings: model('SiteSettings', siteSettingsSchema, 'siteSettings'),
  admins: model('AdminUser', adminSchema, 'admins'),
  categories: model('Category', categorySchema, 'categories'),
  banners: model('Banner', bannerSchema, 'banners'),
  blogPosts: model('BlogPost', blogPostSchema, 'blogPosts'),
  freelanceRequests: model('FreelanceRequest', freelanceRequestSchema, 'freelanceRequests'),
}

export function getModelForCollection(collectionName) {
  const modelForCollection = collectionModels[collectionName]
  if (!modelForCollection) {
    throw Object.assign(new Error(`Unsupported MongoDB collection: ${collectionName}`), { statusCode: 500 })
  }

  return modelForCollection
}

export { collectionModels }
