import { db, isFirestoreConfigured } from '../lib/firebase.js'
import { fallbackStore } from '../lib/fallbackStore.js'

export const DEFAULT_REVIEW_IMAGE = 'https://cdn-icons-png.magnific.com/512/7486/7486744.png'

function mapDoc(doc) {
  return { id: doc.id, ...doc.data() }
}

export async function listReviews() {
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
  if (!isFirestoreConfigured) return fallbackStore.listMessages()

  try {
    const snapshot = await db.collection('contactMessages').orderBy('createdAt', 'desc').get()
    return snapshot.docs.map(mapDoc)
  } catch {
    return fallbackStore.listMessages()
  }
}

export async function createQuoteRequest(data) {
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
  if (!isFirestoreConfigured) return fallbackStore.listQuotes()

  try {
    const snapshot = await db.collection('quoteRequests').orderBy('createdAt', 'desc').get()
    return snapshot.docs.map(mapDoc)
  } catch {
    return fallbackStore.listQuotes()
  }
}

export async function registerUser(data) {
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
  const { password, ...safeUser } = user
  return { id: docRef.id, ...safeUser }
}

export async function loginUser(email, password) {
  if (!isFirestoreConfigured) return fallbackStore.loginUser(email, password)

  const snapshot = await db
    .collection('users')
    .where('email', '==', email.toLowerCase())
    .where('password', '==', password)
    .limit(1)
    .get()

  if (snapshot.empty) throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 })

  const user = mapDoc(snapshot.docs[0])
  const { password: _password, ...safeUser } = user
  return safeUser
}

export async function updateUser(id, updates) {
  if (!isFirestoreConfigured) return fallbackStore.updateUser(id, updates)

  const updateData = { ...updates, updatedAt: new Date() }
  await db.collection('users').doc(id).update(updateData)
  const user = mapDoc(await db.collection('users').doc(id).get())
  const { password, ...safeUser } = user
  return safeUser
}

export async function listUserAddresses(userId) {
  if (!isFirestoreConfigured) return fallbackStore.listAddresses(userId)

  const snapshot = await db.collection('addresses').where('userId', '==', userId).get()
  return snapshot.docs.map(mapDoc)
}

export async function createUserAddress(userId, data) {
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
  if (!isFirestoreConfigured) return fallbackStore.deleteAddress(userId, addressId)

  const docRef = db.collection('addresses').doc(addressId)
  const doc = await docRef.get()
  await docRef.delete()
  return doc.exists ? mapDoc(doc) : null
}

export async function listUserOrders(userId) {
  if (!isFirestoreConfigured) return fallbackStore.listOrders(userId)

  const snapshot = await db.collection('orders').where('userId', '==', userId).get()
  return snapshot.docs.map(mapDoc)
}

export async function createUserOrder(userId, data) {
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
