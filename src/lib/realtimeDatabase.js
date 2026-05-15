import { realtimeDb } from './firebase.js'

export function nowIso() {
  return new Date().toISOString()
}

export function createRealtimeId(path) {
  return realtimeDb.ref(path).push().key
}

export function snapshotToList(snapshot) {
  const value = snapshot.val()
  if (!value) return []

  if (Array.isArray(value)) {
    return value
      .map((item, index) => (item ? { id: item.id || String(index), ...item } : null))
      .filter(Boolean)
  }

  return Object.entries(value).map(([id, item]) => ({ id, ...item }))
}

export async function listRealtime(path) {
  const snapshot = await realtimeDb.ref(path).once('value')
  return snapshotToList(snapshot)
}

export async function getRealtime(path, id) {
  const snapshot = await realtimeDb.ref(`${path}/${id}`).once('value')
  const value = snapshot.val()
  if (!value) return null
  return { id, ...value }
}

export async function createRealtime(path, data) {
  const id = data.id || createRealtimeId(path)
  const record = {
    ...data,
    id,
    createdAt: data.createdAt || nowIso(),
    updatedAt: nowIso(),
  }
  await realtimeDb.ref(`${path}/${id}`).set(record)
  return record
}

export async function updateRealtime(path, id, updates) {
  const current = await getRealtime(path, id)
  if (!current) throw Object.assign(new Error('Record not found'), { statusCode: 404 })
  const record = { ...current, ...updates, id, updatedAt: nowIso() }
  await realtimeDb.ref(`${path}/${id}`).update(record)
  return record
}

export async function deleteRealtime(path, id) {
  const current = await getRealtime(path, id)
  if (!current) throw Object.assign(new Error('Record not found'), { statusCode: 404 })
  await realtimeDb.ref(`${path}/${id}`).remove()
  return current
}

export async function listRealtimeWhere(path, field, value) {
  const items = await listRealtime(path)
  return items.filter((item) => item[field] === value)
}

export function sortNewest(items) {
  return [...items].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
}
