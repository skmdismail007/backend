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

function normalizeStringList(values) {
  if (!Array.isArray(values)) return []
  return values.map((value) => String(value || '').trim()).filter(Boolean)
}

function normalizeServicePayload(data, { partial = false } = {}) {
  const normalized = { ...data }

  if (!partial || Object.prototype.hasOwnProperty.call(data, 'name')) normalized.name = data.name?.trim()
  if (!partial || Object.prototype.hasOwnProperty.call(data, 'category')) {
    normalized.category = data.category?.trim() || ''
  }
  if (!partial || Object.prototype.hasOwnProperty.call(data, 'price')) normalized.price = Number(data.price || 0)
  if (!partial || Object.prototype.hasOwnProperty.call(data, 'timeline')) {
    normalized.timeline = data.timeline?.trim() || ''
  }
  if (!partial || Object.prototype.hasOwnProperty.call(data, 'description')) {
    normalized.description = data.description?.trim()
  }
  if (!partial || Object.prototype.hasOwnProperty.call(data, 'summary')) {
    normalized.summary = data.summary?.trim() || data.description?.trim() || ''
  }
  if (!partial || Object.prototype.hasOwnProperty.call(data, 'image')) {
    normalized.image = data.image?.trim() || ''
  }
  if (!partial || Object.prototype.hasOwnProperty.call(data, 'deliverables')) {
    normalized.deliverables = normalizeStringList(data.deliverables)
  }
  if (!partial || Object.prototype.hasOwnProperty.call(data, 'isActive')) {
    normalized.isActive = data.isActive ?? true
  }

  return normalized
}

export async function listServices(filters = {}) {
  const includeInactive = filters.includeInactive === true || filters.includeInactive === 'true'
  let query = includeInactive
    ? collectionRef('services')
    : collectionRef('services').where('isActive', '==', true)

  if (filters.category) query = query.where('category', '==', filters.category)

  const snapshot = await query.get()
  return sortNewest(snapshot.docs.map(mapDoc))
}

export function getServiceById(id) {
  return getDocument('services', id)
}

export async function createService(data) {
  const normalized = normalizeServicePayload(data)
  return createDocument('services', normalized, data.id)
}

export async function updateService(id, data) {
  const current = await getServiceById(id)
  const updated = await updateDocument('services', id, normalizeServicePayload(data, { partial: true }))
  const removedImageUrls = [current.image].filter((url) => url && url !== updated.image)
  await deleteImagesByUrls(removedImageUrls)
  return updated
}

export async function deleteService(id) {
  const service = await deleteDocument('services', id)
  await deleteImagesByUrls([service.image])
  return service
}
