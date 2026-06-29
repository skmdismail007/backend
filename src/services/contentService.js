import {
  collectionRef,
  createDocument,
  deleteDocument,
  getDocument,
  mapDoc,
  sortNewest,
  updateDocument,
} from './realtimeDataService.js'
import { deleteImagesByUrls } from './imageService.js'

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeStringList(values) {
  if (!Array.isArray(values)) return []
  return values.map((value) => String(value || '').trim()).filter(Boolean)
}

function normalizeCategory(data) {
  const name = data.name?.trim()
  return {
    name,
    slug: data.slug?.trim() || slugify(name),
    type: data.type || 'product',
    description: data.description?.trim() || '',
    image: data.image?.trim() || '',
    sortOrder: Number(data.sortOrder || 0),
    isActive: data.isActive ?? true,
  }
}

function normalizeBanner(data) {
  const title = data.title?.trim()
  return {
    title,
    subtitle: data.subtitle?.trim() || '',
    image: data.image?.trim() || '',
    linkLabel: data.linkLabel?.trim() || '',
    linkUrl: data.linkUrl?.trim() || '',
    placement: data.placement?.trim() || 'home',
    sortOrder: Number(data.sortOrder || 0),
    isActive: data.isActive ?? true,
  }
}

function normalizeBlogPost(data) {
  const title = data.title?.trim()
  return {
    title,
    slug: data.slug?.trim() || slugify(title),
    excerpt: data.excerpt?.trim() || '',
    content: data.content?.trim() || '',
    image: data.image?.trim() || '',
    author: data.author?.trim() || '',
    tags: normalizeStringList(data.tags),
    published: data.published ?? false,
    publishedAt: data.published ? data.publishedAt || new Date().toISOString() : data.publishedAt || '',
  }
}

function applyActiveFilter(query, includeInactive) {
  return includeInactive ? query : query.where('isActive', '==', true)
}

export async function listCategories(filters = {}) {
  const includeInactive = filters.includeInactive === true || filters.includeInactive === 'true'
  let query = applyActiveFilter(collectionRef('categories'), includeInactive)
  if (filters.type) query = query.where('type', '==', filters.type)
  const snapshot = await query.get()
  return snapshot.docs
    .map(mapDoc)
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0) || a.name.localeCompare(b.name))
}

export function saveCategory(data, id) {
  return id
    ? updateDocument('categories', id, normalizeCategory(data))
    : createDocument('categories', normalizeCategory(data), data.id)
}

export async function deleteCategory(id) {
  const category = await deleteDocument('categories', id)
  await deleteImagesByUrls([category.image])
  return category
}

export async function listBanners(filters = {}) {
  const includeInactive = filters.includeInactive === true || filters.includeInactive === 'true'
  let query = applyActiveFilter(collectionRef('banners'), includeInactive)
  if (filters.placement) query = query.where('placement', '==', filters.placement)
  const snapshot = await query.get()
  return snapshot.docs
    .map(mapDoc)
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
}

export function saveBanner(data, id) {
  return id
    ? updateDocument('banners', id, normalizeBanner(data))
    : createDocument('banners', normalizeBanner(data), data.id)
}

export async function deleteBanner(id) {
  const banner = await deleteDocument('banners', id)
  await deleteImagesByUrls([banner.image])
  return banner
}

export async function listBlogPosts(filters = {}) {
  const includeDrafts = filters.includeDrafts === true || filters.includeDrafts === 'true'
  let query = includeDrafts ? collectionRef('blogPosts') : collectionRef('blogPosts').where('published', '==', true)
  if (filters.tag) query = query.where('tags', 'array-contains', filters.tag)
  const snapshot = await query.get()
  return sortNewest(snapshot.docs.map(mapDoc))
}

export async function getBlogPost(idOrSlug) {
  const directDoc = await collectionRef('blogPosts').doc(idOrSlug).get()
  if (directDoc.exists) return mapDoc(directDoc)

  const snapshot = await collectionRef('blogPosts').where('slug', '==', idOrSlug).limit(1).get()
  if (snapshot.empty) throw Object.assign(new Error('Record not found'), { statusCode: 404 })
  return mapDoc(snapshot.docs[0])
}

export function saveBlogPost(data, id) {
  return id
    ? updateDocument('blogPosts', id, normalizeBlogPost(data))
    : createDocument('blogPosts', normalizeBlogPost(data), data.id)
}

export async function deleteBlogPost(id) {
  const post = await deleteDocument('blogPosts', id)
  await deleteImagesByUrls([post.image])
  return post
}

export function createFreelanceRequest(data) {
  return createDocument('freelanceRequests', {
    ...data,
    status: 'new',
  })
}

export async function listFreelanceRequests() {
  const snapshot = await collectionRef('freelanceRequests').get()
  return sortNewest(snapshot.docs.map(mapDoc))
}

export function updateFreelanceRequestStatus(id, status) {
  return updateDocument('freelanceRequests', id, { status })
}

export function deleteFreelanceRequest(id) {
  return deleteDocument('freelanceRequests', id)
}
