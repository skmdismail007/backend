import { randomUUID } from 'node:crypto'
import { getDatabasePool, getDatabaseStatus } from '../config/database.js'

export const FieldValue = {
  serverTimestamp: () => new Date().toISOString(),
}

export function now() {
  return new Date().toISOString()
}

export function notFound(message = 'Record not found') {
  return Object.assign(new Error(message), { statusCode: 404 })
}

export function databaseUnavailable(message = 'Database is not connected. Verify the MySQL environment variables and network access.') {
  return Object.assign(new Error(message), {
    statusCode: 503,
    code: 'DATABASE_UNAVAILABLE',
    databaseStatus: getDatabaseStatus(),
  })
}

export function ensureDatabaseReady() {
  if (getDatabaseStatus() !== 'connected') throw databaseUnavailable()
}

function normalizeValue(value) {
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(normalizeValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalizeValue(entry)]))
  }
  return value
}

export function mapRealtimeValue(value) {
  return normalizeValue(value)
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

function ensureKey(id) {
  const key = String(id || '').trim()
  if (!key) throw Object.assign(new Error('Invalid record id'), { statusCode: 400 })
  return key
}

function parseRow(row) {
  let value = {}
  try {
    value = JSON.parse(row.data || '{}')
  } catch {
    value = {}
  }
  return { id: row.id, ...value }
}

function getField(record, field) {
  return field.split('.').reduce((value, part) => value?.[part], record)
}

function valuesEqual(actual, expected) {
  if (actual === expected) return true
  if (actual == null || expected == null) return false
  return String(actual) === String(expected)
}

function matches(record, [field, operator, expected]) {
  const actual = getField(record, field)
  if (operator === '==') return valuesEqual(actual, expected)
  if (operator === '!=') return !valuesEqual(actual, expected)
  if (operator === 'array-contains') return Array.isArray(actual) && actual.some((item) => valuesEqual(item, expected))
  if (operator === 'in') {
    if (!Array.isArray(expected)) throw Object.assign(new Error('"in" filter expects an array value'), { statusCode: 400 })
    return expected.some((item) => valuesEqual(actual, item))
  }
  throw Object.assign(new Error(`Unsupported filter operator: ${operator}`), { statusCode: 400 })
}

function compareValues(a, b) {
  if (a == null && b == null) return 0
  if (a == null) return -1
  if (b == null) return 1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  const dateA = Date.parse(a)
  const dateB = Date.parse(b)
  if (!Number.isNaN(dateA) && !Number.isNaN(dateB)) return dateA - dateB
  return String(a).localeCompare(String(b))
}

class SqlDocumentSnapshot {
  constructor(collectionName, id, value) {
    this.id = id
    this.ref = new SqlDocumentRef(collectionName, id)
    this.exists = value !== null && value !== undefined
    this._value = this.exists ? value : null
  }

  data() {
    return this._value || {}
  }
}

class SqlQuerySnapshot {
  constructor(docs) {
    this.docs = docs
    this.size = docs.length
    this.empty = docs.length === 0
  }
}

class SqlDocumentRef {
  constructor(collectionName, id) {
    this.collectionName = collectionName
    this.id = ensureKey(id)
  }

  async get() {
    ensureDatabaseReady()
    const [rows] = await getDatabasePool().execute(
      'SELECT id, data FROM app_records WHERE collection_name = ? AND id = ? LIMIT 1',
      [this.collectionName, this.id],
    )
    return new SqlDocumentSnapshot(this.collectionName, this.id, rows[0] ? parseRow(rows[0]) : null)
  }

  async set(data, options = {}) {
    ensureDatabaseReady()
    const incoming = stripUndefined(data)
    let record = { id: this.id, ...incoming }
    if (options.merge) {
      const current = await this.get()
      record = { ...(current.exists ? current.data() : {}), ...record }
    }
    await getDatabasePool().execute(
      `INSERT INTO app_records (collection_name, id, data, created_at, updated_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
       ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = CURRENT_TIMESTAMP(3)`,
      [this.collectionName, this.id, JSON.stringify(record)],
    )
  }

  async update(updates) {
    ensureDatabaseReady()
    const current = await this.get()
    if (!current.exists) throw notFound()
    await this.set({ ...current.data(), ...stripUndefined(updates) })
  }

  async delete() {
    ensureDatabaseReady()
    await getDatabasePool().execute(
      'DELETE FROM app_records WHERE collection_name = ? AND id = ?',
      [this.collectionName, this.id],
    )
  }
}

class SqlCollectionQuery {
  constructor(collectionName, options = {}) {
    this.collectionName = collectionName
    this.filters = options.filters || []
    this.order = options.order || null
    this.limitCount = options.limitCount || null
  }

  doc(id) {
    return new SqlDocumentRef(this.collectionName, id)
  }

  where(field, operator, value) {
    return new SqlCollectionQuery(this.collectionName, {
      filters: [...this.filters, [field, operator, value]],
      order: this.order,
      limitCount: this.limitCount,
    })
  }

  orderBy(field, direction = 'asc') {
    return new SqlCollectionQuery(this.collectionName, {
      filters: this.filters,
      order: [field, direction],
      limitCount: this.limitCount,
    })
  }

  limit(limitCount) {
    return new SqlCollectionQuery(this.collectionName, {
      filters: this.filters,
      order: this.order,
      limitCount,
    })
  }

  async get() {
    ensureDatabaseReady()
    const [rows] = await getDatabasePool().execute(
      'SELECT id, data FROM app_records WHERE collection_name = ?',
      [this.collectionName],
    )
    let records = rows.map(parseRow).filter((record) => this.filters.every((filter) => matches(record, filter)))
    if (this.order) {
      const [field, direction] = this.order
      records.sort((a, b) => {
        const result = compareValues(getField(a, field), getField(b, field))
        return direction === 'desc' ? -result : result
      })
    }
    if (this.limitCount) records = records.slice(0, this.limitCount)
    return new SqlQuerySnapshot(
      records.map((record) => new SqlDocumentSnapshot(this.collectionName, record.id, record)),
    )
  }
}

export function collectionRef(collectionName) {
  return new SqlCollectionQuery(collectionName)
}

export async function getDocument(collectionName, id) {
  const doc = await collectionRef(collectionName).doc(id).get()
  if (!doc.exists) throw notFound()
  return mapDoc(doc)
}

export async function listDocuments(collectionName, options = {}) {
  const { filters = [], limit, orderBy = ['createdAt', 'desc'] } = options
  let query = collectionRef(collectionName)
  filters.forEach(([field, operator, value]) => { query = query.where(field, operator, value) })
  if (orderBy) query = query.orderBy(orderBy[0], orderBy[1] || 'asc')
  if (limit) query = query.limit(limit)
  const snapshot = await query.get()
  return snapshot.docs.map(mapDoc)
}

export async function createDocument(collectionName, data, id) {
  const documentId = ensureKey(id || data.id || randomUUID())
  const record = stripUndefined({
    ...data,
    id: documentId,
    createdAt: data.createdAt || now(),
    updatedAt: now(),
  })
  await collectionRef(collectionName).doc(documentId).set(record)
  return getDocument(collectionName, documentId)
}

export async function updateDocument(collectionName, id, updates) {
  const ref = collectionRef(collectionName).doc(id)
  const existing = await ref.get()
  if (!existing.exists) throw notFound()
  await ref.set({ ...stripUndefined(updates), updatedAt: now() }, { merge: true })
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
  filters.forEach(([field, operator, value]) => { query = query.where(field, operator, value) })
  const result = await query.get()
  return result.size
}

export async function deleteQuerySnapshot(snapshot) {
  await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()))
  return snapshot.docs.length
}

export function sortNewest(items) {
  return [...items].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
}
