import { db, isFirestoreConfigured } from '../lib/firebase.js'
import { fallbackStore } from '../lib/fallbackStore.js'

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
  if (!isFirestoreConfigured) return fallbackStore.createReview(data)

  try {
    const review = {
      image: '',
      isApproved: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    }
    const docRef = await db.collection('reviews').add(review)
    return { id: docRef.id, ...review }
  } catch {
    return fallbackStore.createReview(data)
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
