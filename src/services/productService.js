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

  if (Object.prototype.hasOwnProperty.call(data, 'name') && data.name !== undefined) {
    normalized.name = data.name?.trim() || 'Untitled Product'
  } else if (!partial && !normalized.name) {
    normalized.name = 'Untitled Product'
  }
  if (Object.prototype.hasOwnProperty.call(data, 'category') && data.category !== undefined) {
    normalized.category = data.category?.trim() || 'General'
  } else if (!partial && !normalized.category) {
    normalized.category = 'General'
  }
  if (Object.prototype.hasOwnProperty.call(data, 'price') && data.price !== undefined) {
    normalized.price = Number(data.price || 0)
  }
  if (Object.prototype.hasOwnProperty.call(data, 'oldPrice') && data.oldPrice !== undefined) {
    normalized.oldPrice = data.oldPrice === '' || data.oldPrice == null ? null : Number(data.oldPrice)
  }
  if (Object.prototype.hasOwnProperty.call(data, 'offerExpiresAt') && data.offerExpiresAt !== undefined) {
    normalized.offerExpiresAt = data.offerExpiresAt || null
  }
  if (Object.prototype.hasOwnProperty.call(data, 'badge') && data.badge !== undefined) {
    normalized.badge = data.badge?.trim() || ''
  }
  if (Object.prototype.hasOwnProperty.call(data, 'brand') && data.brand !== undefined) {
    normalized.brand = data.brand?.trim() || ''
  }
  if (Object.prototype.hasOwnProperty.call(data, 'modelName') && data.modelName !== undefined) {
    normalized.modelName = data.modelName?.trim() || ''
  }
  if (Object.prototype.hasOwnProperty.call(data, 'modelNumber') && data.modelNumber !== undefined) {
    normalized.modelNumber = data.modelNumber?.trim() || ''
  }
  if (Object.prototype.hasOwnProperty.call(data, 'asin') && data.asin !== undefined) {
    normalized.asin = data.asin?.trim() || ''
  }
  if (Object.prototype.hasOwnProperty.call(data, 'unitCount') && data.unitCount !== undefined) {
    normalized.unitCount = data.unitCount?.trim() || ''
  }
  if (Object.prototype.hasOwnProperty.call(data, 'numberOfItems') && data.numberOfItems !== undefined) {
    normalized.numberOfItems = data.numberOfItems?.trim() || ''
  }
  if (Object.prototype.hasOwnProperty.call(data, 'numberOfPacks') && data.numberOfPacks !== undefined) {
    normalized.numberOfPacks = data.numberOfPacks?.trim() || ''
  }
  if (Object.prototype.hasOwnProperty.call(data, 'countryOfOrigin') && data.countryOfOrigin !== undefined) {
    normalized.countryOfOrigin = data.countryOfOrigin?.trim() || ''
  }
  if (Object.prototype.hasOwnProperty.call(data, 'importerContact') && data.importerContact !== undefined) {
    normalized.importerContact = data.importerContact?.trim() || ''
  }
  if (Object.prototype.hasOwnProperty.call(data, 'itemTypeName') && data.itemTypeName !== undefined) {
    normalized.itemTypeName = data.itemTypeName?.trim() || ''
  }
  if (Object.prototype.hasOwnProperty.call(data, 'manufacturerPartNumber') && data.manufacturerPartNumber !== undefined) {
    normalized.manufacturerPartNumber = data.manufacturerPartNumber?.trim() || ''
  }
  if (Object.prototype.hasOwnProperty.call(data, 'warranty') && data.warranty !== undefined) {
    normalized.warranty = data.warranty?.trim() || ''
  }
  if (Object.prototype.hasOwnProperty.call(data, 'weight') && data.weight !== undefined) {
    normalized.weight = data.weight?.trim() || ''
  }
  if (Object.prototype.hasOwnProperty.call(data, 'dimensions') && data.dimensions !== undefined) {
    normalized.dimensions = data.dimensions?.trim() || ''
  }
  if (Object.prototype.hasOwnProperty.call(data, 'color') && data.color !== undefined) {
    normalized.color = data.color?.trim() || ''
  }
  if (Object.prototype.hasOwnProperty.call(data, 'material') && data.material !== undefined) {
    normalized.material = data.material?.trim() || ''
  }
  if (Object.prototype.hasOwnProperty.call(data, 'short') && data.short !== undefined) {
    normalized.short = data.short?.trim() || ''
  }
  if (Object.prototype.hasOwnProperty.call(data, 'details') && data.details !== undefined) {
    normalized.details = data.details?.trim() || ''
  }
  if (Object.prototype.hasOwnProperty.call(data, 'specs') && data.specs !== undefined) {
    normalized.specs = normalizeStringList(data.specs)
  }
  if (Object.prototype.hasOwnProperty.call(data, 'includes') && data.includes !== undefined) {
    normalized.includes = normalizeStringList(data.includes)
  }
  if (Object.prototype.hasOwnProperty.call(data, 'images') && data.images !== undefined) {
    normalized.images = normalizeImageList(data.images)
  }
  if (Object.prototype.hasOwnProperty.call(data, 'image') && data.image !== undefined) {
    normalized.image = typeof data.image === 'string' ? data.image.trim() : ''
  }
  if (Object.prototype.hasOwnProperty.call(data, 'isActive') && data.isActive !== undefined) {
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
  if (env.nodeEnv !== 'production') console.debug('[backend] creating product in MySQL', {
    name: normalized.name,
    category: normalized.category,
  })
  const product = await createDocument('products', normalized, data.id)
  if (env.nodeEnv !== 'production') console.debug('[backend] MySQL product result', { id: product.id })
  return product
}

export async function updateProduct(id, data) {
  const current = await getProductById(id)
  const normalized = normalizeProductPayload(data, { partial: true })
  console.log('[backend updateProduct] incoming data:', data)
  console.log('[backend updateProduct] normalized payload:', normalized)
  const updated = await updateDocument('products', id, normalized)
  console.log('[backend updateProduct] result from updateDocument:', updated)
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
