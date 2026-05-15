import { readFile, writeFile } from 'node:fs/promises'

const catalogPath = new URL('../../data/catalog.json', import.meta.url)
const runtimePath = new URL('../../data/runtime.json', import.meta.url)

let store

function now() {
  return new Date().toISOString()
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch {
    return fallback
  }
}

async function saveStore() {
  await writeFile(runtimePath, JSON.stringify(store, null, 2))
}

function normalizeProduct(product) {
  return {
    id: product.id || createId('product'),
    name: product.name,
    category: product.category || 'CCTV',
    price: Number(product.price || 0),
    badge: product.badge || '',
    image: product.image || '',
    short: product.short || product.description || product.details || product.name,
    details: product.details || product.description || product.short || product.name,
    specs: product.specs || [],
    includes: product.includes || [],
    isActive: product.isActive ?? true,
    createdAt: product.createdAt || now(),
    updatedAt: product.updatedAt || now(),
  }
}

function normalizeService(service) {
  return {
    id: service.id || createId('service'),
    name: service.name,
    category: service.category || 'Website',
    price: Number(service.price || 0),
    timeline: service.timeline || '',
    description: service.description || service.summary || service.text || service.name,
    summary: service.summary || service.description || service.name,
    image: Array.isArray(service.images) ? service.images[0] : service.image || '',
    deliverables: service.deliverables || service.features || [],
    isActive: service.isActive ?? true,
    createdAt: service.createdAt || now(),
    updatedAt: service.updatedAt || now(),
  }
}

async function getStore() {
  if (store) return store

  const catalog = await readJson(catalogPath, { products: [], services: [] })
  const runtime = await readJson(runtimePath, {})

  store = {
    products: runtime.products || (catalog.products || []).map(normalizeProduct),
    services: runtime.services || (catalog.services || []).map(normalizeService),
    reviews:
      runtime.reviews ||
      [
        {
          id: 'review-retail',
          name: 'Rahul Sharma',
          project: 'Retail CCTV setup',
          rating: 5,
          image:
            'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=700&q=80',
          text: 'Akiwa helped us choose cameras, storage, and cabling without overcomplicating the order.',
          isApproved: true,
          createdAt: now(),
          updatedAt: now(),
        },
      ],
    messages: runtime.messages || [],
    quotes: runtime.quotes || [],
  }

  return store
}

export const fallbackStore = {
  async health() {
    await getStore()
    return { status: 'ok', service: 'akiwa-backend', database: 'json-fallback' }
  },

  async listProducts(filters = {}) {
    const data = await getStore()
    const search = filters.search?.toLowerCase()
    let products = data.products.filter((item) => item.isActive)
    if (filters.category) products = products.filter((item) => item.category === filters.category)
    if (search) {
      products = products.filter((item) =>
        [item.name, item.category, item.short, item.details].join(' ').toLowerCase().includes(search),
      )
    }
    if (filters.sort === 'price-low') products = [...products].sort((a, b) => a.price - b.price)
    if (filters.sort === 'price-high') products = [...products].sort((a, b) => b.price - a.price)
    return products
  },

  async getProduct(id) {
    const data = await getStore()
    const product = data.products.find((item) => item.id === id)
    if (!product) throw Object.assign(new Error('Record not found'), { statusCode: 404 })
    return product
  },

  async saveProduct(product, id) {
    const data = await getStore()
    const record = normalizeProduct({ ...product, id: id || product.id, updatedAt: now() })
    const index = data.products.findIndex((item) => item.id === record.id)
    if (index >= 0) data.products[index] = { ...data.products[index], ...record }
    else data.products.unshift(record)
    await saveStore()
    return index >= 0 ? data.products[index] : record
  },

  async deleteProduct(id) {
    const data = await getStore()
    const product = await this.getProduct(id)
    product.isActive = false
    product.updatedAt = now()
    await saveStore()
    return data.products.find((item) => item.id === id)
  },

  async listServices() {
    const data = await getStore()
    return data.services.filter((item) => item.isActive)
  },

  async getService(id) {
    const data = await getStore()
    const service = data.services.find((item) => item.id === id)
    if (!service) throw Object.assign(new Error('Record not found'), { statusCode: 404 })
    return service
  },

  async saveService(service, id) {
    const data = await getStore()
    const record = normalizeService({ ...service, id: id || service.id, updatedAt: now() })
    const index = data.services.findIndex((item) => item.id === record.id)
    if (index >= 0) data.services[index] = { ...data.services[index], ...record }
    else data.services.unshift(record)
    await saveStore()
    return index >= 0 ? data.services[index] : record
  },

  async deleteService(id) {
    const data = await getStore()
    const service = await this.getService(id)
    service.isActive = false
    service.updatedAt = now()
    await saveStore()
    return data.services.find((item) => item.id === id)
  },

  async listReviews(approvedOnly = true) {
    const data = await getStore()
    return data.reviews.filter((item) => !approvedOnly || item.isApproved)
  },

  async createReview(review) {
    const data = await getStore()
    const record = {
      id: createId('review'),
      image: '',
      isApproved: true,
      createdAt: now(),
      updatedAt: now(),
      ...review,
    }
    data.reviews.unshift(record)
    await saveStore()
    return record
  },

  async updateReview(id, isApproved) {
    const review = (await getStore()).reviews.find((item) => item.id === id)
    if (!review) throw Object.assign(new Error('Record not found'), { statusCode: 404 })
    review.isApproved = isApproved
    review.updatedAt = now()
    await saveStore()
    return review
  },

  async deleteReview(id) {
    const data = await getStore()
    const review = data.reviews.find((item) => item.id === id)
    data.reviews = data.reviews.filter((item) => item.id !== id)
    await saveStore()
    return review
  },

  async createMessage(message) {
    const data = await getStore()
    const record = { id: createId('message'), status: 'new', createdAt: now(), updatedAt: now(), ...message }
    data.messages.unshift(record)
    await saveStore()
    return record
  },

  async listMessages() {
    return (await getStore()).messages
  },

  async updateMessage(id, status) {
    const message = (await getStore()).messages.find((item) => item.id === id)
    if (!message) throw Object.assign(new Error('Record not found'), { statusCode: 404 })
    message.status = status
    message.updatedAt = now()
    await saveStore()
    return message
  },

  async deleteMessage(id) {
    const data = await getStore()
    const message = data.messages.find((item) => item.id === id)
    data.messages = data.messages.filter((item) => item.id !== id)
    await saveStore()
    return message
  },

  async createQuote(quote) {
    const data = await getStore()
    const record = {
      id: createId('quote'),
      status: 'new',
      createdAt: now(),
      updatedAt: now(),
      ...quote,
      items: quote.items.map((item) => ({ id: createId('quote-item'), ...item })),
    }
    data.quotes.unshift(record)
    await saveStore()
    return record
  },

  async listQuotes() {
    return (await getStore()).quotes
  },

  async updateQuote(id, status) {
    const quote = (await getStore()).quotes.find((item) => item.id === id)
    if (!quote) throw Object.assign(new Error('Record not found'), { statusCode: 404 })
    quote.status = status
    quote.updatedAt = now()
    await saveStore()
    return quote
  },

  async deleteQuote(id) {
    const data = await getStore()
    const quote = data.quotes.find((item) => item.id === id)
    data.quotes = data.quotes.filter((item) => item.id !== id)
    await saveStore()
    return quote
  },

  async summary() {
    const data = await getStore()
    return {
      totals: {
        products: data.products.filter((item) => item.isActive).length,
        services: data.services.filter((item) => item.isActive).length,
        reviews: data.reviews.length,
        newMessages: data.messages.filter((item) => item.status === 'new').length,
        newQuotes: data.quotes.filter((item) => item.status === 'new').length,
      },
      latestMessages: data.messages.slice(0, 5),
      latestQuotes: data.quotes.slice(0, 5),
    }
  },
}
