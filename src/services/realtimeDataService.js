import { realtimeDb } from '../lib/firebase.js'

export const FieldValue = {
  serverTimestamp: () => new Date().toISOString(),
}

export function now() {
  return new Date().toISOString()
}

export function notFound(message = 'Record not found') {
  return Object.assign(new Error(message), { statusCode: 404 })
}

export function mapRealtimeValue(value) {
  if (!value) return value
  if (typeof value.toDate === 'function') return value.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(mapRealtimeValue)
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, mapRealtimeValue(entry)]),
    )
  }
  return value
}

export function mapDoc(doc) {
  return { id: doc.id, ...mapRealtimeValue(doc.data() || {}) }
}

export function stripUndefined(data) {
  if (Array.isArray(data)) return data.map(stripUndefined).filter((value) => value !== undefined)
  if (data instanceof Date) return data.toISOString()
  if (!data || typeof data !== 'object') return data

  return Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, stripUndefined(value)]),
  )
}

function ensureRealtimeKey(id) {
  const key = String(id || '').trim()
  if (!key || /[.#$/[\]]/.test(key)) {
    throw Object.assign(new Error('Invalid record id for Firebase Realtime Database'), { statusCode: 400 })
  }
  return key
}

function compareValues(a, b, direction = 'asc') {
  const first = a ?? ''
  const second = b ?? ''
  const result =
    typeof first === 'number' && typeof second === 'number'
      ? first - second
      : String(first).localeCompare(String(second))
  return direction === 'desc' ? -result : result
}

function matchesFilter(record, [field, operator, expected]) {
  const actual = record?.[field]

  if (operator === '==') return actual === expected
  if (operator === 'array-contains') return Array.isArray(actual) && actual.includes(expected)
  if (operator === '!=') return actual !== expected
  if (operator === 'in') return Array.isArray(expected) && expected.includes(actual)

  throw Object.assign(new Error(`Unsupported Realtime Database filter operator: ${operator}`), {
    statusCode: 400,
  })
}

class RealtimeDocumentSnapshot {
  constructor(collectionName, id, value) {
    this.id = id
    this.ref = new RealtimeDocumentRef(collectionName, id)
    this.exists = value !== null && value !== undefined
    this._value = value
  }

  data() {
    return this._value || {}
  }
}

class RealtimeQuerySnapshot {
  constructor(docs) {
    this.docs = docs
    this.size = docs.length
    this.empty = docs.length === 0
  }
}

class RealtimeDocumentRef {
  constructor(collectionName, id) {
    this.collectionName = collectionName
    this.id = ensureRealtimeKey(id)
    this.path = `${collectionName}/${this.id}`
  }

  ref() {
    return realtimeDb.ref(this.path)
  }

  async get() {
    const snapshot = await this.ref().once('value')
    return new RealtimeDocumentSnapshot(this.collectionName, this.id, snapshot.val())
  }

  async set(data, options = {}) {
    const record = stripUndefined(data)
    if (options.merge) {
      await this.ref().update(record)
      return
    }
    await this.ref().set(record)
  }

  async update(updates) {
    await this.ref().update(stripUndefined(updates))
  }

  async delete() {
    await this.ref().remove()
  }
}

class RealtimeCollectionQuery {
  constructor(collectionName, options = {}) {
    this.collectionName = collectionName
    this.filters = options.filters || []
    this.order = options.order || null
    this.limitCount = options.limitCount || null
  }

  doc(id) {
    return new RealtimeDocumentRef(this.collectionName, id)
  }

  where(field, operator, value) {
    return new RealtimeCollectionQuery(this.collectionName, {
      filters: [...this.filters, [field, operator, value]],
      order: this.order,
      limitCount: this.limitCount,
    })
  }

  orderBy(field, direction = 'asc') {
    return new RealtimeCollectionQuery(this.collectionName, {
      filters: this.filters,
      order: [field, direction],
      limitCount: this.limitCount,
    })
  }

  limit(limitCount) {
    return new RealtimeCollectionQuery(this.collectionName, {
      filters: this.filters,
      order: this.order,
      limitCount,
    })
  }

  async get() {
    const snapshot = await realtimeDb.ref(this.collectionName).once('value')
    const value = snapshot.val() || {}
    let entries = Object.entries(value)

    if (this.filters.length) {
      entries = entries.filter(([, record]) =>
        this.filters.every((filter) => matchesFilter(record, filter)),
      )
    }

    if (this.order) {
      const [field, direction] = this.order
      entries = entries.sort(([, a], [, b]) => compareValues(a?.[field], b?.[field], direction))
    }

    if (this.limitCount) entries = entries.slice(0, this.limitCount)

    return new RealtimeQuerySnapshot(
      entries.map(([id, record]) => new RealtimeDocumentSnapshot(this.collectionName, id, record)),
    )
  }
}

export function collectionRef(collectionName) {
  return new RealtimeCollectionQuery(collectionName)
}

export async function getDocument(collectionName, id) {
  const doc = await collectionRef(collectionName).doc(id).get()
  if (!doc.exists) throw notFound()
  return mapDoc(doc)
}

export async function listDocuments(collectionName, options = {}) {
  const {
    filters = [],
    limit,
    orderBy = ['createdAt', 'desc'],
  } = options
  let query = collectionRef(collectionName)

  filters.forEach(([field, operator, value]) => {
    query = query.where(field, operator, value)
  })

  if (orderBy) {
    const [field, direction = 'asc'] = orderBy
    query = query.orderBy(field, direction)
  }

  if (limit) query = query.limit(limit)

  const snapshot = await query.get()
  return snapshot.docs.map(mapDoc)
}

export async function createDocument(collectionName, data, id) {
  const record = stripUndefined({
    ...data,
    createdAt: now(),
    updatedAt: now(),
  })

  const ref = id
    ? collectionRef(collectionName).doc(id)
    : collectionRef(collectionName).doc(realtimeDb.ref(collectionName).push().key)
  await ref.set(record)
  return getDocument(collectionName, ref.id)
}

export async function updateDocument(collectionName, id, updates) {
  const ref = collectionRef(collectionName).doc(id)
  const existing = await ref.get()
  if (!existing.exists) throw notFound()
  await ref.set(stripUndefined({ ...updates, updatedAt: now() }), { merge: true })
  return getDocument(collectionName, id)
}

export async function deleteDocument(collectionName, id) {
  const ref = collectionRef(collectionName).doc(id)
  const existing = await ref.get()
  if (!existing.exists) throw notFound()
  await ref.delete()
  return mapDoc(existing)
}

export async function countDocuments(collectionName, filters = []) {
  let query = collectionRef(collectionName)
  filters.forEach(([field, operator, value]) => {
    query = query.where(field, operator, value)
  })

  const snapshot = await query.get()
  return snapshot.size
}

export async function deleteQuerySnapshot(snapshot) {
  await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()))
  return snapshot.docs.length
}

export function sortNewest(items) {
  return [...items].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
}
