import { db, isFirestoreConfigured, isRealtimeDatabaseConfigured } from '../lib/firebase.js'
import { fallbackStore } from '../lib/fallbackStore.js'
import {
  deleteRealtime,
  getRealtime,
  listRealtime,
  listRealtimeWhere,
  sortNewest,
  updateRealtime,
} from '../lib/realtimeDatabase.js'

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
  if (isRealtimeDatabaseConfigured) {
    const [products, services, reviews, messages, quotes, users, orders] = await Promise.all([
      fallbackStore.listProducts(),
      fallbackStore.listServices(),
      listRealtime('reviews'),
      listRealtime('contactMessages'),
      listRealtime('quoteRequests'),
      listRealtime('users'),
      listRealtime('orders'),
    ])

    return {
      totals: {
        products: products.length,
        services: services.length,
        reviews: reviews.length,
        newMessages: messages.filter((item) => item.status === 'new').length,
        newQuotes: quotes.filter((item) => item.status === 'new').length,
        users: users.length,
        orders: orders.length,
      },
      latestMessages: sortNewest(messages).slice(0, 5),
      latestQuotes: sortNewest(quotes).slice(0, 5),
    }
  }

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
  if (isRealtimeDatabaseConfigured) return sortNewest((await listRealtime('users')).map(withoutPassword))

  if (!isFirestoreConfigured) return fallbackStore.listUsers()
  const users = await listCollection('users')
  return users.map(withoutPassword)
}

export async function getUserDetails(id) {
  if (isRealtimeDatabaseConfigured) {
    const userRecord = await getRealtime('users', id)
    if (!userRecord) throw Object.assign(new Error('Record not found'), { statusCode: 404 })

    const user = withoutPassword(userRecord)
    const addresses = sortNewest(await listRealtimeWhere('addresses', 'userId', id))
    const orders = sortNewest(await listRealtimeWhere('orders', 'userId', id))
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
  }

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
  if (isRealtimeDatabaseConfigured) return sortNewest(await listRealtime('addresses'))

  if (!isFirestoreConfigured) return fallbackStore.listAddresses()
  return listCollection('addresses')
}

export async function listOrders() {
  if (isRealtimeDatabaseConfigured) return sortNewest(await listRealtime('orders'))

  if (!isFirestoreConfigured) return fallbackStore.listOrders()
  return listCollection('orders')
}

export async function updateOrderStatus(id, status) {
  if (isRealtimeDatabaseConfigured) return updateRealtime('orders', id, { status })

  if (!isFirestoreConfigured) return fallbackStore.updateOrderStatus(id, status)

  const update = { status, updatedAt: new Date() }
  await db.collection('orders').doc(id).update(update)
  const doc = await db.collection('orders').doc(id).get()
  return mapDoc(doc)
}

export async function listAllReviews() {
  if (isRealtimeDatabaseConfigured) return sortNewest(await listRealtime('reviews'))

  if (!isFirestoreConfigured) return fallbackStore.listReviews(false)

  try {
    const snapshot = await db.collection('reviews').orderBy('createdAt', 'desc').get()
    return snapshot.docs.map(mapDoc)
  } catch {
    return fallbackStore.listReviews(false)
  }
}

export async function updateReviewApproval(id, isApproved) {
  if (isRealtimeDatabaseConfigured) return updateRealtime('reviews', id, { isApproved })

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
  if (isRealtimeDatabaseConfigured) return deleteRealtime('reviews', id)

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
  if (isRealtimeDatabaseConfigured) return updateRealtime('contactMessages', id, { status })

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
  if (isRealtimeDatabaseConfigured) return deleteRealtime('contactMessages', id)

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
  if (isRealtimeDatabaseConfigured) return updateRealtime('quoteRequests', id, { status })

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
  if (isRealtimeDatabaseConfigured) return deleteRealtime('quoteRequests', id)

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

export async function updateUserByAdmin(id, updates) {
  if (isRealtimeDatabaseConfigured) return withoutPassword(await updateRealtime('users', id, updates))
  if (!isFirestoreConfigured) return fallbackStore.updateUser(id, updates)

  await db.collection('users').doc(id).update({ ...updates, updatedAt: new Date() })
  const doc = await db.collection('users').doc(id).get()
  return withoutPassword(mapDoc(doc))
}

export async function deleteUserByAdmin(id) {
  if (isRealtimeDatabaseConfigured) {
    const user = withoutPassword(await deleteRealtime('users', id))
    const [addresses, orders] = await Promise.all([
      listRealtimeWhere('addresses', 'userId', id),
      listRealtimeWhere('orders', 'userId', id),
    ])
    await Promise.all([
      ...addresses.map((address) => deleteRealtime('addresses', address.id)),
      ...orders.map((order) => deleteRealtime('orders', order.id)),
    ])
    return user
  }

  if (!isFirestoreConfigured) return fallbackStore.deleteUser(id)

  const userDoc = await db.collection('users').doc(id).get()
  if (!userDoc.exists) throw Object.assign(new Error('Record not found'), { statusCode: 404 })
  const [addresses, orders] = await Promise.all([
    db.collection('addresses').where('userId', '==', id).get(),
    db.collection('orders').where('userId', '==', id).get(),
  ])
  await Promise.all([
    ...addresses.docs.map((doc) => doc.ref.delete()),
    ...orders.docs.map((doc) => doc.ref.delete()),
    db.collection('users').doc(id).delete(),
  ])
  return withoutPassword(mapDoc(userDoc))
}

export async function updateAddressByAdmin(id, updates) {
  if (isRealtimeDatabaseConfigured) {
    const current = await getRealtime('addresses', id)
    if (!current) throw Object.assign(new Error('Record not found'), { statusCode: 404 })
    if (updates.isDefault) {
      const addresses = await listRealtimeWhere('addresses', 'userId', current.userId)
      await Promise.all(
        addresses
          .filter((address) => address.id !== id)
          .map((address) => updateRealtime('addresses', address.id, { isDefault: false })),
      )
    }
    return updateRealtime('addresses', id, updates)
  }
  if (!isFirestoreConfigured) return fallbackStore.updateAddress(id, updates)

  const currentDoc = await db.collection('addresses').doc(id).get()
  if (!currentDoc.exists) throw Object.assign(new Error('Record not found'), { statusCode: 404 })
  const current = mapDoc(currentDoc)
  if (updates.isDefault) {
    const addresses = await db.collection('addresses').where('userId', '==', current.userId).get()
    await Promise.all(
      addresses.docs
        .filter((doc) => doc.id !== id)
        .map((doc) => doc.ref.update({ isDefault: false, updatedAt: new Date() })),
    )
  }
  await db.collection('addresses').doc(id).update({ ...updates, updatedAt: new Date() })
  const doc = await db.collection('addresses').doc(id).get()
  return mapDoc(doc)
}

export async function deleteAddressByAdmin(id) {
  if (isRealtimeDatabaseConfigured) return deleteRealtime('addresses', id)
  if (!isFirestoreConfigured) return fallbackStore.deleteAddressById(id)

  const docRef = db.collection('addresses').doc(id)
  const doc = await docRef.get()
  if (!doc.exists) throw Object.assign(new Error('Record not found'), { statusCode: 404 })
  await docRef.delete()
  return mapDoc(doc)
}

export async function updateOrderByAdmin(id, updates) {
  if (isRealtimeDatabaseConfigured) return updateRealtime('orders', id, updates)
  if (!isFirestoreConfigured) return fallbackStore.updateOrder(id, updates)

  await db.collection('orders').doc(id).update({ ...updates, updatedAt: new Date() })
  const doc = await db.collection('orders').doc(id).get()
  return mapDoc(doc)
}

export async function deleteOrderByAdmin(id) {
  if (isRealtimeDatabaseConfigured) return deleteRealtime('orders', id)
  if (!isFirestoreConfigured) return fallbackStore.deleteOrder(id)

  const docRef = db.collection('orders').doc(id)
  const doc = await docRef.get()
  if (!doc.exists) throw Object.assign(new Error('Record not found'), { statusCode: 404 })
  await docRef.delete()
  return mapDoc(doc)
}
