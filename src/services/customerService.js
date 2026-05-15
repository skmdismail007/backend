import { prisma } from '../lib/prisma.js'
import { fallbackStore } from '../lib/fallbackStore.js'

export async function listReviews() {
  try {
    return await prisma.review.findMany({
      where: { isApproved: true },
      orderBy: { createdAt: 'desc' },
    })
  } catch {
    return fallbackStore.listReviews(true)
  }
}

export async function createReview(data) {
  try {
    return await prisma.review.create({
      data,
    })
  } catch {
    return fallbackStore.createReview(data)
  }
}

export async function createContactMessage(data) {
  try {
    return await prisma.contactMessage.create({
      data,
    })
  } catch {
    return fallbackStore.createMessage(data)
  }
}

export async function listContactMessages() {
  try {
    return await prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
    })
  } catch {
    return fallbackStore.listMessages()
  }
}

export async function createQuoteRequest(data) {
  try {
    return await prisma.quoteRequest.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        note: data.note,
        items: {
          create: data.items,
        },
      },
      include: { items: true },
    })
  } catch {
    return fallbackStore.createQuote(data)
  }
}

export async function listQuoteRequests() {
  try {
    return await prisma.quoteRequest.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    })
  } catch {
    return fallbackStore.listQuotes()
  }
}
