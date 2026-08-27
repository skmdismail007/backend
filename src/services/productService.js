import {
  collectionRef,
  createDocument,
  getDocument,
  mapDoc,
  updateDocument,
  deleteDocument,
  sortNewest,
} from './realtimeDataService.js'
import { deleteImagesByUrls } from './imageService.js'
import { env } from '../config/env.js'

const MAX_PRODUCT_IMAGES = 10

function normalizeImageList(images) {
  if (!Array.isArray(images)) return []

  return [
    ...new Set(
      images
        .map((image) => (typeof image === 'string' ? image.trim() : ''))
        .filter(Boolean),
    ),
  ].slice(0, MAX_PRODUCT_IMAGES)
}

function normalizeStringList(values) {
  if (!Array.isArray(values)) return []
  return values.map((value) => String(value || '').trim()).filter(Boolean)
}

function getProductImageReferences(product = {}) {
  return [
    product.image,
    ...(Array.isArray(product.images) ? product.images : []),
  ].filter(Boolean)
}

function normalizeProductPayload(data, { partial = false } = {}) {
  const normalized = { ...data }

  if (!partial || Object.prototype.hasOwnProperty.call(data, 'name')) {
    normalized.name = data.name?.trim()
  }
  if (!partial || Object.prototype.hasOwnProperty.call(data, 'category')) {
    normalized.category = data.category?.trim()
  }
  if (!partial || Object.prototype.hasOwnProperty.call(data, 'price')) {
    normalized.price = Number(data.price || 0)
  }
  if (!partial || Object.prototype.hasOwnProperty.call(data, 'oldPrice')) {
    normalized.oldPrice = data.oldPrice === '' || data.oldPrice == null ? null : Number(data.oldPrice)
  }
  if (!partial || Object.prototype.hasOwnProperty.call(data, 'offerExpiresAt')) {
    normalized.offerExpiresAt = data.offerExpiresAt || null
  }
  if (!partial || Object.prototype.hasOwnProperty.call(data, 'badge')) {
    normalized.badge = data.badge?.trim() || ''
  }
  if (!partial || Object.prototype.hasOwnProperty.call(data, 'short')) {
    normalized.short = data.short?.trim()
  }
  if (!partial || Object.prototype.hasOwnProperty.call(data, 'details')) {
    normalized.details = data.details?.trim()
  }
  if (!partial || Object.prototype.hasOwnProperty.call(data, 'specs')) {
    normalized.specs = normalizeStringList(data.specs)
  }
  if (!partial || Object.prototype.hasOwnProperty.call(data, 'includes')) {
    normalized.includes = normalizeStringList(data.includes)
  }
  if (!partial || Object.prototype.hasOwnProperty.call(data, 'images')) {
    normalized.images = normalizeImageList(data.images)
  }
  if (
    !partial ||
    Object.prototype.hasOwnProperty.call(data, 'image') ||
    Object.prototype.hasOwnProperty.call(data, 'images')
  ) {
    const image = typeof data.image === 'string' ? data.image.trim() : ''
    normalized.image = image || normalized.images?.[0] || ''
  }
  if (!partial || Object.prototype.hasOwnProperty.call(data, 'isActive')) {
    normalized.isActive = data.isActive ?? true
  }

  return normalized
}

export async function listProducts(filters = {}) {
  const includeInactive = filters.includeInactive === true || filters.includeInactive === 'true'
  let query = includeInactive
    ? collectionRef('products')
    : collectionRef('products').where('isActive', '==', true)

  if (filters.category) query = query.where('category', '==', filters.category)

  const snapshot = await query.get()
  let products = snapshot.docs.map(mapDoc)

  if (filters.search) {
    const search = filters.search.toLowerCase()
    products = products.filter((product) =>
      [product.name, product.category, product.short, product.details, product.badge]
        .join(' ')
        .toLowerCase()
        .includes(search),
    )
  }

  if (filters.sort === 'price-low') return products.sort((a, b) => (a.price || 0) - (b.price || 0))
  if (filters.sort === 'price-high') return products.sort((a, b) => (b.price || 0) - (a.price || 0))
  return sortNewest(products)
}

export function getProductById(id) {
  return getDocument('products', id)
}

export async function createProduct(data) {
  const normalized = normalizeProductPayload(data)
  if (env.nodeEnv !== 'production') console.debug('[backend] creating product in MongoDB', {
    name: normalized.name,
    category: normalized.category,
  })
  const product = await createDocument('products', normalized, data.id)
  if (env.nodeEnv !== 'production') console.debug('[backend] MongoDB product result', { id: product.id })
  return product
}

export async function updateProduct(id, data) {
  const current = await getProductById(id)
  const updated = await updateDocument('products', id, normalizeProductPayload(data, { partial: true }))
  const removedImageUrls = getProductImageReferences(current).filter(
    (url) => !getProductImageReferences(updated).includes(url),
  )
  await deleteImagesByUrls(removedImageUrls)
  return updated
}

export async function deleteProduct(id) {
  const product = await deleteDocument('products', id)
  await deleteImagesByUrls(getProductImageReferences(product))
  return product
}
