import {
  collectionRef,
  createDocument,
  deleteDocument,
  getDocument,
  mapDoc,
  notFound,
  sortNewest,
  updateDocument,
} from './realtimeDataService.js'
import { deleteImagesByUrls } from './imageService.js'

function withoutPassword(user) {
  const safeUser = { ...user }
  delete safeUser.password
  return safeUser
}

function normalizePayment(payment = {}, total = 0) {
  const labels = {
    cod: 'Cash on Delivery',
    card: 'Card Payment',
    upi: 'UPI Payment',
  }
  const method = payment.method || 'cod'
  const normalized = {
    method,
    label: payment.label || labels[method] || 'Payment',
    status: payment.status || 'pending',
    amount: Number(payment.amount ?? total ?? 0),
  }

  if (method === 'card' && payment.card) {
    normalized.card = {
      cardholder: payment.card.cardholder || '',
      brand: payment.card.brand || '',
      last4: payment.card.last4 || '',
    }
  }

  if (method === 'upi' && payment.upi) {
    normalized.upi = {
      upiId: payment.upi.upiId || '',
    }
  }

  if (payment.notes) normalized.notes = payment.notes
  return normalized
}

export async function listReviews({ approvedOnly = true } = {}) {
  let query = collectionRef('reviews')
  if (approvedOnly) query = query.where('isApproved', '==', true)
  const snapshot = await query.get()
  return sortNewest(snapshot.docs.map(mapDoc))
}

export async function createReview(data) {
  const review = {
    name: data.name,
    project: data.project,
    rating: Number(data.rating || 5),
    image: data.image?.trim() || '',
    text: data.text,
    isApproved: true,
  }
  return createDocument('reviews', review)
}

export function createContactMessage(data) {
  return createDocument('contactMessages', {
    status: 'new',
    ...data,
  })
}

export async function listContactMessages() {
  const snapshot = await collectionRef('contactMessages').get()
  return sortNewest(snapshot.docs.map(mapDoc))
}

export function createQuoteRequest(data) {
  return createDocument('quoteRequests', {
    name: data.name,
    email: data.email,
    phone: data.phone,
    note: data.note || '',
    items: data.items,
    status: 'new',
  })
}

export async function listQuoteRequests() {
  const snapshot = await collectionRef('quoteRequests').get()
  return sortNewest(snapshot.docs.map(mapDoc))
}

export async function registerUser(data) {
  const email = data.email.toLowerCase()
  const existing = await collectionRef('users').where('email', '==', email).limit(1).get()
  if (!existing.empty) throw Object.assign(new Error('Email already registered'), { statusCode: 409 })

  const user = await createDocument('users', {
    name: data.name,
    email,
    password: data.password,
    phone: data.phone || '',
  })
  return withoutPassword(user)
}

export async function loginUser(email, password) {
  const snapshot = await collectionRef('users')
    .where('email', '==', email.toLowerCase())
    .where('password', '==', password)
    .limit(1)
    .get()

  if (snapshot.empty) throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 })
  return withoutPassword(mapDoc(snapshot.docs[0]))
}

export async function updateUser(id, updates) {
  const allowedUpdates = {
    name: updates.name,
    email: updates.email?.toLowerCase(),
    phone: updates.phone,
  }
  return withoutPassword(await updateDocument('users', id, allowedUpdates))
}

export async function listUserAddresses(userId) {
  const snapshot = await collectionRef('addresses').where('userId', '==', userId).get()
  return sortNewest(snapshot.docs.map(mapDoc))
}

export async function createUserAddress(userId, data) {
  await getDocument('users', userId)
  const existing = await listUserAddresses(userId)
  const address = {
    ...data,
    userId,
    isDefault: data.isDefault ?? existing.length === 0,
  }

  if (address.isDefault) {
    await Promise.all(
      existing.map((item) =>
        updateDocument('addresses', item.id, { isDefault: false }),
      ),
    )
  }

  return createDocument('addresses', address)
}

export async function updateUserAddress(userId, addressId, data) {
  const address = await getDocument('addresses', addressId)
  if (address.userId !== userId) throw notFound()

  const updates = { ...data, userId }
  if (data.isDefault) {
    const existing = await listUserAddresses(userId)
    await Promise.all(
      existing
        .filter((item) => item.id !== addressId)
        .map((item) => updateDocument('addresses', item.id, { isDefault: false })),
    )
  }

  return updateDocument('addresses', addressId, updates)
}

export async function setUserDefaultAddress(userId, addressId) {
  const addresses = await listUserAddresses(userId)
  if (!addresses.some((address) => address.id === addressId)) throw notFound()

  await Promise.all(
    addresses.map((item) =>
      updateDocument('addresses', item.id, { isDefault: item.id === addressId }),
    ),
  )

  return getDocument('addresses', addressId)
}

export async function deleteUserAddress(userId, addressId) {
  const address = await getDocument('addresses', addressId)
  if (address.userId !== userId) throw notFound()
  return deleteDocument('addresses', addressId)
}

export async function listUserOrders(userId) {
  const snapshot = await collectionRef('orders').where('userId', '==', userId).get()
  return sortNewest(snapshot.docs.map(mapDoc))
}

export function createUserOrder(userId, data) {
  const orderPayload = {
    ...data,
    userId,
    payment: normalizePayment(data.payment, data.total),
    status: data.status || 'pending',
    trackingNumber: data.trackingNumber || `AKIWA${Date.now().toString().slice(-8).toUpperCase()}`,
  }

  return createDocument('orders', orderPayload)
}

export async function cancelUserOrder(orderId, cancellationReason) {
  const order = await getDocument('orders', orderId)
  if (order.status === 'cancelled' && order.cancelledBy === 'user') return order

  return updateDocument('orders', orderId, {
    status: 'cancelled',
    cancellationReason: cancellationReason || '',
    cancelledBy: 'user',
    cancelledAt: new Date().toISOString(),
  })
}

export async function deleteReviewWithFile(id) {
  const review = await deleteDocument('reviews', id)
  await deleteImagesByUrls([review.image])
  return review
}
