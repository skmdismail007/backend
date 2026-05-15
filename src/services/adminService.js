import { db, isFirestoreConfigured } from '../lib/firebase.js'
import { fallbackStore } from '../lib/fallbackStore.js'

function mapDoc(doc) {
  return { id: doc.id, ...doc.data() }
}

function withoutPassword(user) {
  const safeUser = { ...user }
  delete safeUser.password
  return safeUser
}

async function countCollection(collectionName, queryBuilder = (collection) => collection) {
  const snapshot = await queryBuilder(db.collection(collectionName)).get()
  return snapshot.size
}

async function latest(collectionName, limit = 5) {
  const snapshot = await db.collection(collectionName).orderBy('createdAt', 'desc').limit(limit).get()
  return snapshot.docs.map(mapDoc)
}

async function listCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get()
  return snapshot.docs.map(mapDoc)
}

export async function getDashboardSummary() {
  if (!isFirestoreConfigured) return fallbackStore.summary()

  try {
    const [products, services, reviews, messages, quotes, latestMessages, latestQuotes] =
      await Promise.all([
        countCollection('products', collection => collection.where('isActive', '==', true)),
        countCollection('services', collection => collection.where('isActive', '==', true)),
        countCollection('reviews'),
        countCollection('contactMessages', collection => collection.where('status', '==', 'new')),
        countCollection('quoteRequests', collection => collection.where('status', '==', 'new')),
        latest('contactMessages'),
        latest('quoteRequests'),
      ])

    return {
      totals: {
        products,
        services,
        reviews,
        newMessages: messages,
        newQuotes: quotes,
        users: await countCollection('users'),
        orders: await countCollection('orders'),
      },
      latestMessages,
      latestQuotes,
    }
  } catch {
    return fallbackStore.summary()
  }
}

export async function listUsers() {
  if (!isFirestoreConfigured) return fallbackStore.listUsers()
  const users = await listCollection('users')
  return users.map(withoutPassword)
}

export async function getUserDetails(id) {
  if (!isFirestoreConfigured) return fallbackStore.getUserDetails(id)

  try {
    const [userDoc, addressSnapshot, orderSnapshot] = await Promise.all([
      db.collection('users').doc(id).get(),
      db.collection('addresses').where('userId', '==', id).get(),
      db.collection('orders').where('userId', '==', id).get(),
    ])

    if (!userDoc.exists) {
      throw Object.assign(new Error('Record not found'), { statusCode: 404 })
    }

    const user = withoutPassword(mapDoc(userDoc))
    const addresses = addressSnapshot.docs.map(mapDoc)
    const orders = orderSnapshot.docs.map(mapDoc)
    const phone =
      user.phone ||
      addresses.find((address) => address.phone)?.phone ||
      orders.find((order) => order.phone)?.phone ||
      orders.find((order) => order.address?.phone)?.address?.phone ||
      ''

    return {
      user,
      addresses,
      orders,
      contact: {
        name: user.name,
        email: user.email || orders.find((order) => order.email)?.email || '',
        phone,
      },
    }
  } catch (error) {
    if (error.statusCode === 404) throw error
    return fallbackStore.getUserDetails(id)
  }
}

export async function listAddresses() {
  if (!isFirestoreConfigured) return fallbackStore.listAddresses()
  return listCollection('addresses')
}

export async function listOrders() {
  if (!isFirestoreConfigured) return fallbackStore.listOrders()
  return listCollection('orders')
}

export async function updateOrderStatus(id, status) {
  if (!isFirestoreConfigured) return fallbackStore.updateOrderStatus(id, status)

  const update = { status, updatedAt: new Date() }
  await db.collection('orders').doc(id).update(update)
  const doc = await db.collection('orders').doc(id).get()
  return mapDoc(doc)
}

export async function listAllReviews() {
  if (!isFirestoreConfigured) return fallbackStore.listReviews(false)

  try {
    const snapshot = await db.collection('reviews').orderBy('createdAt', 'desc').get()
    return snapshot.docs.map(mapDoc)
  } catch {
    return fallbackStore.listReviews(false)
  }
}

export async function updateReviewApproval(id, isApproved) {
  if (!isFirestoreConfigured) return fallbackStore.updateReview(id, isApproved)

  try {
    const update = { isApproved, updatedAt: new Date() }
    await db.collection('reviews').doc(id).update(update)
    const doc = await db.collection('reviews').doc(id).get()
    return mapDoc(doc)
  } catch {
    return fallbackStore.updateReview(id, isApproved)
  }
}

export async function deleteReview(id) {
  if (!isFirestoreConfigured) return fallbackStore.deleteReview(id)

  try {
    const docRef = db.collection('reviews').doc(id)
    const doc = await docRef.get()
    await docRef.delete()
    return doc.exists ? mapDoc(doc) : null
  } catch {
    return fallbackStore.deleteReview(id)
  }
}

export async function updateMessageStatus(id, status) {
  if (!isFirestoreConfigured) return fallbackStore.updateMessage(id, status)

  try {
    const update = { status, updatedAt: new Date() }
    await db.collection('contactMessages').doc(id).update(update)
    const doc = await db.collection('contactMessages').doc(id).get()
    return mapDoc(doc)
  } catch {
    return fallbackStore.updateMessage(id, status)
  }
}

export async function deleteMessage(id) {
  if (!isFirestoreConfigured) return fallbackStore.deleteMessage(id)

  try {
    const docRef = db.collection('contactMessages').doc(id)
    const doc = await docRef.get()
    await docRef.delete()
    return doc.exists ? mapDoc(doc) : null
  } catch {
    return fallbackStore.deleteMessage(id)
  }
}

export async function updateQuoteStatus(id, status) {
  if (!isFirestoreConfigured) return fallbackStore.updateQuote(id, status)

  try {
    const update = { status, updatedAt: new Date() }
    await db.collection('quoteRequests').doc(id).update(update)
    const doc = await db.collection('quoteRequests').doc(id).get()
    return mapDoc(doc)
  } catch {
    return fallbackStore.updateQuote(id, status)
  }
}

export async function deleteQuote(id) {
  if (!isFirestoreConfigured) return fallbackStore.deleteQuote(id)

  try {
    const docRef = db.collection('quoteRequests').doc(id)
    const doc = await docRef.get()
    await docRef.delete()
    return doc.exists ? mapDoc(doc) : null
  } catch {
    return fallbackStore.deleteQuote(id)
  }
}
