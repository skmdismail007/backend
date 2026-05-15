import { prisma } from '../lib/prisma.js'
import { fallbackStore } from '../lib/fallbackStore.js'

export async function getDashboardSummary() {
  try {
    const [products, services, reviews, messages, quotes, latestMessages, latestQuotes] =
      await Promise.all([
        prisma.product.count({ where: { isActive: true } }),
        prisma.service.count({ where: { isActive: true } }),
        prisma.review.count(),
        prisma.contactMessage.count({ where: { status: 'new' } }),
        prisma.quoteRequest.count({ where: { status: 'new' } }),
        prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
        prisma.quoteRequest.findMany({
          include: { items: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
      ])

    return {
      totals: {
        products,
        services,
        reviews,
        newMessages: messages,
        newQuotes: quotes,
      },
      latestMessages,
      latestQuotes,
    }
  } catch {
    return fallbackStore.summary()
  }
}

export async function listAllReviews() {
  try {
    return await prisma.review.findMany({ orderBy: { createdAt: 'desc' } })
  } catch {
    return fallbackStore.listReviews(false)
  }
}

export async function updateReviewApproval(id, isApproved) {
  try {
    return await prisma.review.update({
      where: { id },
      data: { isApproved },
    })
  } catch {
    return fallbackStore.updateReview(id, isApproved)
  }
}

export async function deleteReview(id) {
  try {
    return await prisma.review.delete({ where: { id } })
  } catch {
    return fallbackStore.deleteReview(id)
  }
}

export async function updateMessageStatus(id, status) {
  try {
    return await prisma.contactMessage.update({
      where: { id },
      data: { status },
    })
  } catch {
    return fallbackStore.updateMessage(id, status)
  }
}

export async function deleteMessage(id) {
  try {
    return await prisma.contactMessage.delete({ where: { id } })
  } catch {
    return fallbackStore.deleteMessage(id)
  }
}

export async function updateQuoteStatus(id, status) {
  try {
    return await prisma.quoteRequest.update({
      where: { id },
      data: { status },
      include: { items: true },
    })
  } catch {
    return fallbackStore.updateQuote(id, status)
  }
}

export async function deleteQuote(id) {
  try {
    return await prisma.quoteRequest.delete({ where: { id } })
  } catch {
    return fallbackStore.deleteQuote(id)
  }
}
