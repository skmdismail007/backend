import { db, isFirestoreConfigured, isRealtimeDatabaseConfigured } from '../lib/firebase.js'
import { fallbackStore } from '../lib/fallbackStore.js'
import {
  createRealtime,
  deleteRealtime,
  getRealtime,
  listRealtime,
  listRealtimeWhere,
  sortNewest,
  updateRealtime,
} from '../lib/realtimeDatabase.js'

export const DEFAULT_REVIEW_IMAGE = 'https://cdn-icons-png.magnific.com/512/7486/7486744.png'

function mapDoc(doc) {
  return { id: doc.id, ...doc.data() }
}

function withoutPassword(user) {
  const safeUser = { ...user }
  delete safeUser.password
  return safeUser
}

export async function listReviews() {
  if (isRealtimeDatabaseConfigured) {
    const reviews = await listRealtime('reviews')
    return sortNewest(reviews.filter((item) => item.isApproved))
  }

  if (!isFirestoreConfigured) return fallbackStore.listReviews(true)

  try {
    const snapshot = await db
      .collection('reviews')
      .where('isApproved', '==', true)
      .orderBy('createdAt', 'desc')
      .get()

    return snapshot.docs.map(mapDoc)
  } catch {
    return fallbackStore.listReviews(true)
  }
}

export async function createReview(data) {
  const reviewPayload = {
    ...data,
    image: data.image?.trim() || DEFAULT_REVIEW_IMAGE,
  }

  if (isRealtimeDatabaseConfigured) {
    return createRealtime('reviews', {
      image: DEFAULT_REVIEW_IMAGE,
      isApproved: true,
      ...reviewPayload,
    })
  }

  if (!isFirestoreConfigured) return fallbackStore.createReview(reviewPayload)

  try {
    const review = {
      image: DEFAULT_REVIEW_IMAGE,
      isApproved: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...reviewPayload,
    }
    const docRef = await db.collection('reviews').add(review)
    return { id: docRef.id, ...review }
  } catch {
    return fallbackStore.createReview(reviewPayload)
  }
}

export async function createContactMessage(data) {
  if (isRealtimeDatabaseConfigured) {
    return createRealtime('contactMessages', {
      status: 'new',
      ...data,
    })
  }

  if (!isFirestoreConfigured) return fallbackStore.createMessage(data)

  try {
    const message = {
      status: 'new',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    }
    const docRef = await db.collection('contactMessages').add(message)
    return { id: docRef.id, ...message }
  } catch {
    return fallbackStore.createMessage(data)
  }
}

export async function listContactMessages() {
  if (isRealtimeDatabaseConfigured) return sortNewest(await listRealtime('contactMessages'))

  if (!isFirestoreConfigured) return fallbackStore.listMessages()

  try {
    const snapshot = await db.collection('contactMessages').orderBy('createdAt', 'desc').get()
    return snapshot.docs.map(mapDoc)
  } catch {
    return fallbackStore.listMessages()
  }
}

export async function createQuoteRequest(data) {
  if (isRealtimeDatabaseConfigured) {
    return createRealtime('quoteRequests', {
      name: data.name,
      email: data.email,
      phone: data.phone,
      note: data.note,
      items: data.items,
      status: 'new',
    })
  }

  if (!isFirestoreConfigured) return fallbackStore.createQuote(data)

  try {
    const quote = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      note: data.note,
      items: data.items,
      status: 'new',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const docRef = await db.collection('quoteRequests').add(quote)
    return { id: docRef.id, ...quote }
  } catch {
    return fallbackStore.createQuote(data)
  }
}

export async function listQuoteRequests() {
  if (isRealtimeDatabaseConfigured) return sortNewest(await listRealtime('quoteRequests'))

  if (!isFirestoreConfigured) return fallbackStore.listQuotes()

  try {
    const snapshot = await db.collection('quoteRequests').orderBy('createdAt', 'desc').get()
    return snapshot.docs.map(mapDoc)
  } catch {
    return fallbackStore.listQuotes()
  }
}

export async function registerUser(data) {
  if (isRealtimeDatabaseConfigured) {
    const users = await listRealtime('users')
    const existing = users.find((item) => item.email?.toLowerCase() === data.email.toLowerCase())
    if (existing) throw Object.assign(new Error('Email already registered'), { statusCode: 409 })

    const user = await createRealtime('users', {
      name: data.name,
      email: data.email.toLowerCase(),
      password: data.password,
    })
    return withoutPassword(user)
  }

  if (!isFirestoreConfigured) return fallbackStore.registerUser(data)

  const existing = await db.collection('users').where('email', '==', data.email.toLowerCase()).limit(1).get()
  if (!existing.empty) throw Object.assign(new Error('Email already registered'), { statusCode: 409 })

  const user = {
    name: data.name,
    email: data.email.toLowerCase(),
    password: data.password,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const docRef = await db.collection('users').add(user)
  return { id: docRef.id, ...withoutPassword(user) }
}

export async function loginUser(email, password) {
  if (isRealtimeDatabaseConfigured) {
    const users = await listRealtime('users')
    const user = users.find(
      (item) => item.email?.toLowerCase() === email.toLowerCase() && item.password === password,
    )
    if (!user) throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 })
    return withoutPassword(user)
  }

  if (!isFirestoreConfigured) return fallbackStore.loginUser(email, password)

  const snapshot = await db
    .collection('users')
    .where('email', '==', email.toLowerCase())
    .where('password', '==', password)
    .limit(1)
    .get()

  if (snapshot.empty) throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 })

  const user = mapDoc(snapshot.docs[0])
  return withoutPassword(user)
}

export async function updateUser(id, updates) {
  if (isRealtimeDatabaseConfigured) return withoutPassword(await updateRealtime('users', id, updates))

  if (!isFirestoreConfigured) return fallbackStore.updateUser(id, updates)

  const updateData = { ...updates, updatedAt: new Date() }
  await db.collection('users').doc(id).update(updateData)
  const user = mapDoc(await db.collection('users').doc(id).get())
  return withoutPassword(user)
}

export async function listUserAddresses(userId) {
  if (isRealtimeDatabaseConfigured) return sortNewest(await listRealtimeWhere('addresses', 'userId', userId))

  if (!isFirestoreConfigured) return fallbackStore.listAddresses(userId)

  const snapshot = await db.collection('addresses').where('userId', '==', userId).get()
  return snapshot.docs.map(mapDoc)
}

export async function createUserAddress(userId, data) {
  if (isRealtimeDatabaseConfigured) {
    const existing = await listUserAddresses(userId)
    const address = {
      ...data,
      userId,
      isDefault: data.isDefault ?? existing.length === 0,
    }

    if (address.isDefault) {
      await Promise.all(existing.map((item) => updateRealtime('addresses', item.id, { isDefault: false })))
    }

    return createRealtime('addresses', address)
  }

  if (!isFirestoreConfigured) return fallbackStore.createAddress(userId, data)

  const existing = await listUserAddresses(userId)
  const address = {
    ...data,
    userId,
    isDefault: data.isDefault ?? existing.length === 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  if (address.isDefault) {
    await Promise.all(
      existing.map(item => db.collection('addresses').doc(item.id).update({ isDefault: false })),
    )
  }

  const docRef = await db.collection('addresses').add(address)
  return { id: docRef.id, ...address }
}

export async function setUserDefaultAddress(userId, addressId) {
  if (isRealtimeDatabaseConfigured) {
    const addresses = await listUserAddresses(userId)
    await Promise.all(
      addresses.map((item) => updateRealtime('addresses', item.id, { isDefault: item.id === addressId })),
    )
    return getRealtime('addresses', addressId)
  }

  if (!isFirestoreConfigured) return fallbackStore.setDefaultAddress(userId, addressId)

  const addresses = await listUserAddresses(userId)
  await Promise.all(
    addresses.map(item =>
      db.collection('addresses').doc(item.id).update({ isDefault: item.id === addressId, updatedAt: new Date() }),
    ),
  )
  return { id: addressId, isDefault: true }
}

export async function deleteUserAddress(userId, addressId) {
  if (isRealtimeDatabaseConfigured) {
    const address = await getRealtime('addresses', addressId)
    if (!address || address.userId !== userId) {
      throw Object.assign(new Error('Record not found'), { statusCode: 404 })
    }
    return deleteRealtime('addresses', addressId)
  }

  if (!isFirestoreConfigured) return fallbackStore.deleteAddress(userId, addressId)

  const docRef = db.collection('addresses').doc(addressId)
  const doc = await docRef.get()
  await docRef.delete()
  return doc.exists ? mapDoc(doc) : null
}

export async function listUserOrders(userId) {
  if (isRealtimeDatabaseConfigured) return sortNewest(await listRealtimeWhere('orders', 'userId', userId))

  if (!isFirestoreConfigured) return fallbackStore.listOrders(userId)

  const snapshot = await db.collection('orders').where('userId', '==', userId).get()
  return snapshot.docs.map(mapDoc)
}

export async function createUserOrder(userId, data) {
  if (isRealtimeDatabaseConfigured) {
    return createRealtime('orders', {
      ...data,
      userId,
      status: data.status || 'pending',
      trackingNumber: data.trackingNumber || `AKIWA${Date.now().toString().slice(-8).toUpperCase()}`,
    })
  }

  if (!isFirestoreConfigured) return fallbackStore.createOrder(userId, data)

  const order = {
    ...data,
    userId,
    status: data.status || 'pending',
    trackingNumber: data.trackingNumber || `AKIWA${Date.now().toString().slice(-8).toUpperCase()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const docRef = await db.collection('orders').add(order)
  return { id: docRef.id, ...order }
}

export async function cancelUserOrder(orderId, cancellationReason) {
  if (isRealtimeDatabaseConfigured) {
    return updateRealtime('orders', orderId, {
      status: 'cancelled',
      cancellationReason: cancellationReason || '',
      cancelledBy: 'user',
      cancelledAt: new Date(),
    })
  }

  if (!isFirestoreConfigured) return fallbackStore.cancelOrder(orderId, cancellationReason)

  const update = {
    status: 'cancelled',
    cancellationReason: cancellationReason || '',
    cancelledBy: 'user',
    cancelledAt: new Date(),
    updatedAt: new Date(),
  }
  await db.collection('orders').doc(orderId).update(update)
  const doc = await db.collection('orders').doc(orderId).get()
  return mapDoc(doc)
}
