import mongoose from 'mongoose'
import { getDatabaseStatus } from '../config/database.js'
import { getModelForCollection } from '../models/index.js'

export const FieldValue = {
  serverTimestamp: () => new Date().toISOString(),
}

export function now() {
  return new Date().toISOString()
}

export function notFound(message = 'Record not found') {
  return Object.assign(new Error(message), { statusCode: 404 })
}

export function databaseUnavailable(message = 'Database is not connected. Add Render outbound IPs to MongoDB Atlas and verify MONGODB_URI.') {
  return Object.assign(new Error(message), {
    statusCode: 503,
    code: 'DATABASE_UNAVAILABLE',
    databaseStatus: getDatabaseStatus(),
  })
}

export function ensureDatabaseReady() {
  if (getDatabaseStatus() !== 'connected') throw databaseUnavailable()
}

export function mapRealtimeValue(value) {
  if (!value) return value
  if (typeof value.toDate === 'function') return value.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  if (value instanceof mongoose.Types.ObjectId) return value.toString()
  if (Array.isArray(value)) return value.map(mapRealtimeValue)
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== '_id' && key !== '__v')
        .map(([key, entry]) => [key, mapRealtimeValue(entry)]),
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
  if (data instanceof mongoose.Types.ObjectId) return data.toString()
  if (!data || typeof data !== 'object') return data

  return Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, stripUndefined(value)]),
  )
}

function createMongoId() {
  return new mongoose.Types.ObjectId().toString()
}

function ensureMongoKey(id) {
  const key = String(id || '').trim()
  if (!key) {
    throw Object.assign(new Error('Invalid record id for MongoDB'), { statusCode: 400 })
  }
  return key
}

function normalizeMongoDocument(value) {
  if (!value) return null
  const record = mapRealtimeValue(value)
  const id = String(value._id || record.id || '')
  delete record._id
  delete record.__v
  return {
    id: record.id || id,
    ...record,
  }
}

function addCondition(query, field, condition) {
  const existing = query[field]

  if (!existing || typeof existing !== 'object' || Array.isArray(existing)) {
    query[field] = condition
    return
  }

  query[field] = { ...existing, ...condition }
}

function buildMongoQuery(filters = []) {
  const query = {}

  filters.forEach(([field, operator, expected]) => {
    if (operator === '==') {
      query[field] = expected
      return
    }

    if (operator === 'array-contains') {
      query[field] = expected
      return
    }

    if (operator === '!=') {
      addCondition(query, field, { $ne: expected })
      return
    }

    if (operator === 'in') {
      if (!Array.isArray(expected)) {
        throw Object.assign(new Error('MongoDB "in" filter expects an array value'), { statusCode: 400 })
      }
      addCondition(query, field, { $in: expected })
      return
    }

    throw Object.assign(new Error(`Unsupported MongoDB filter operator: ${operator}`), {
      statusCode: 400,
    })
  })

  return query
}

class MongoDocumentSnapshot {
  constructor(collectionName, id, value) {
    this.id = id
    this.ref = new MongoDocumentRef(collectionName, id)
    this.exists = value !== null && value !== undefined
    this._value = normalizeMongoDocument(value)
  }

  data() {
    return this._value || {}
  }
}

class MongoQuerySnapshot {
  constructor(docs) {
    this.docs = docs
    this.size = docs.length
    this.empty = docs.length === 0
  }
}

class MongoDocumentRef {
  constructor(collectionName, id) {
    this.collectionName = collectionName
    this.id = ensureMongoKey(id)
  }

  model() {
    return getModelForCollection(this.collectionName)
  }

  async get() {
    ensureDatabaseReady()
    const record = await this.model().findOne({ _id: this.id }).lean()
    return new MongoDocumentSnapshot(this.collectionName, this.id, record)
  }

  async set(data, options = {}) {
    ensureDatabaseReady()
    const record = stripUndefined(data)
    const document = {
      ...record,
      id: record.id || this.id,
    }

    if (options.merge) {
      await this.model().updateOne(
        { _id: this.id },
        { $set: document },
        { runValidators: true, upsert: true },
      )
      return
    }

    await this.model().replaceOne(
      { _id: this.id },
      { _id: this.id, ...document },
      { runValidators: true, upsert: true },
    )
  }

  async update(updates) {
    ensureDatabaseReady()
    const record = stripUndefined(updates)
    await this.model().updateOne(
      { _id: this.id },
      { $set: record },
      { runValidators: true },
    )
  }

  async delete() {
    ensureDatabaseReady()
    await this.model().deleteOne({ _id: this.id })
  }
}

class MongoCollectionQuery {
  constructor(collectionName, options = {}) {
    this.collectionName = collectionName
    this.filters = options.filters || []
    this.order = options.order || null
    this.limitCount = options.limitCount || null
  }

  model() {
    return getModelForCollection(this.collectionName)
  }

  doc(id) {
    return new MongoDocumentRef(this.collectionName, id)
  }

  where(field, operator, value) {
    return new MongoCollectionQuery(this.collectionName, {
      filters: [...this.filters, [field, operator, value]],
      order: this.order,
      limitCount: this.limitCount,
    })
  }

  orderBy(field, direction = 'asc') {
    return new MongoCollectionQuery(this.collectionName, {
      filters: this.filters,
      order: [field, direction],
      limitCount: this.limitCount,
    })
  }

  limit(limitCount) {
    return new MongoCollectionQuery(this.collectionName, {
      filters: this.filters,
      order: this.order,
      limitCount,
    })
  }

  async get() {
    ensureDatabaseReady()
    const query = this.model().find(buildMongoQuery(this.filters)).lean()

    if (this.order) {
      const [field, direction] = this.order
      query.sort({ [field]: direction === 'desc' ? -1 : 1 })
    }

    if (this.limitCount) query.limit(this.limitCount)

    const records = await query.exec()
    return new MongoQuerySnapshot(
      records.map((record) =>
        new MongoDocumentSnapshot(this.collectionName, String(record._id || record.id), record),
      ),
    )
  }
}

export function collectionRef(collectionName) {
  return new MongoCollectionQuery(collectionName)
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
  const documentId = ensureMongoKey(id || createMongoId())
  const record = stripUndefined({
    ...data,
    id: data.id || documentId,
    createdAt: data.createdAt || now(),
    updatedAt: now(),
  })

  const ref = collectionRef(collectionName).doc(documentId)
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
  ensureDatabaseReady()
  return getModelForCollection(collectionName).countDocuments(buildMongoQuery(filters))
}

export async function deleteQuerySnapshot(snapshot) {
  await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()))
  return snapshot.docs.length
}

export function sortNewest(items) {
  return [...items].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
}
