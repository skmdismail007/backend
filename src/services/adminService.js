import {
  collectionRef,
  countDocuments,
  deleteDocument,
  deleteQuerySnapshot,
  getDocument,
  mapDoc,
  sortNewest,
  updateDocument,
} from './realtimeDataService.js'
import { deleteReviewWithFile } from './customerService.js'

function withoutPassword(user) {
  const safeUser = { ...user }
  delete safeUser.password
  return safeUser
}

async function latest(collectionName, limit = 5) {
  const snapshot = await collectionRef(collectionName).limit(limit).get()
  return sortNewest(snapshot.docs.map(mapDoc)).slice(0, limit)
}

async function listCollection(collectionName) {
  const snapshot = await collectionRef(collectionName).get()
  return sortNewest(snapshot.docs.map(mapDoc))
}

export async function getDashboardSummary() {
  const [
    products,
    services,
    reviews,
    newMessages,
    newQuotes,
    users,
    orders,
    categories,
    banners,
    blogPosts,
    freelanceRequests,
    latestMessages,
    latestQuotes,
  ] = await Promise.all([
    countDocuments('products', [['isActive', '==', true]]),
    countDocuments('services', [['isActive', '==', true]]),
    countDocuments('reviews'),
    countDocuments('contactMessages', [['status', '==', 'new']]),
    countDocuments('quoteRequests', [['status', '==', 'new']]),
    countDocuments('users'),
    countDocuments('orders'),
    countDocuments('categories'),
    countDocuments('banners'),
    countDocuments('blogPosts'),
    countDocuments('freelanceRequests', [['status', '==', 'new']]),
    latest('contactMessages'),
    latest('quoteRequests'),
  ])

  return {
    totals: {
      products,
      services,
      reviews,
      newMessages,
      newQuotes,
      users,
      orders,
      categories,
      banners,
      blogPosts,
      freelanceRequests,
    },
    latestMessages,
    latestQuotes,
  }
}

export async function listUsers() {
  return (await listCollection('users')).map(withoutPassword)
}

export async function getUserDetails(id) {
  const [user, addressSnapshot, orderSnapshot] = await Promise.all([
    getDocument('users', id),
    collectionRef('addresses').where('userId', '==', id).get(),
    collectionRef('orders').where('userId', '==', id).get(),
  ])
  const addresses = sortNewest(addressSnapshot.docs.map(mapDoc))
  const orders = sortNewest(orderSnapshot.docs.map(mapDoc))
  const safeUser = withoutPassword(user)
  const phone =
    safeUser.phone ||
    addresses.find((address) => address.phone)?.phone ||
    orders.find((order) => order.phone)?.phone ||
    orders.find((order) => order.address?.phone)?.address?.phone ||
    ''

  return {
    user: safeUser,
    addresses,
    orders,
    contact: {
      name: safeUser.name,
      email: safeUser.email || orders.find((order) => order.email)?.email || '',
      phone,
    },
  }
}

export function listAddresses() {
  return listCollection('addresses')
}

export function listOrders() {
  return listCollection('orders')
}

export function listAllReviews() {
  return listCollection('reviews')
}

export function updateReviewApproval(id, isApproved) {
  return updateDocument('reviews', id, { isApproved })
}

export function deleteReview(id) {
  return deleteReviewWithFile(id)
}

export function updateMessageStatus(id, status) {
  return updateDocument('contactMessages', id, { status })
}

export function deleteMessage(id) {
  return deleteDocument('contactMessages', id)
}

export function updateQuoteStatus(id, status) {
  return updateDocument('quoteRequests', id, { status })
}

export function deleteQuote(id) {
  return deleteDocument('quoteRequests', id)
}

export async function updateUserByAdmin(id, updates) {
  return withoutPassword(await updateDocument('users', id, updates))
}

export async function deleteUserByAdmin(id) {
  const user = await getDocument('users', id)
  const [addresses, orders] = await Promise.all([
    collectionRef('addresses').where('userId', '==', id).get(),
    collectionRef('orders').where('userId', '==', id).get(),
  ])

  await Promise.all([
    deleteQuerySnapshot(addresses),
    deleteQuerySnapshot(orders),
    deleteDocument('users', id),
  ])

  return withoutPassword(user)
}

export async function updateAddressByAdmin(id, updates) {
  const current = await getDocument('addresses', id)

  if (updates.isDefault) {
    const addresses = await collectionRef('addresses').where('userId', '==', current.userId).get()
    await Promise.all(
      addresses.docs
        .filter((doc) => doc.id !== id)
        .map((doc) => updateDocument('addresses', doc.id, { isDefault: false })),
    )
  }

  return updateDocument('addresses', id, updates)
}

export function deleteAddressByAdmin(id) {
  return deleteDocument('addresses', id)
}

export function updateOrderStatus(id, status) {
  return updateDocument('orders', id, { status })
}

export function updateOrderByAdmin(id, updates) {
  return updateDocument('orders', id, updates)
}

export function deleteOrderByAdmin(id) {
  return deleteDocument('orders', id)
}
