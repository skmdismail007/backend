import {
  collectionRef,
  createDocument,
  deleteDocument,
  getDocument,
  mapDoc,
  sortNewest,
  updateDocument,
} from './realtimeDataService.js'

function isOfferCurrentlyActive(offer) {
  if (offer.isActive === false) return false
  const now = Date.now()
  if (offer.startDate) {
    const start = new Date(offer.startDate).getTime()
    if (!Number.isNaN(start) && start > now) return false
  }
  if (offer.endDate) {
    const end = new Date(offer.endDate).getTime()
    if (!Number.isNaN(end) && end < now) return false
  }
  return true
}

export async function listOffers({ publicOnly = false, onProductOnly = false } = {}) {
  const snapshot = await collectionRef('offers').get()
  let offers = snapshot.docs.map(mapDoc)

  if (publicOnly) {
    offers = offers.filter(isOfferCurrentlyActive)
  }

  if (onProductOnly) {
    offers = offers.filter((o) => o.showOnProduct !== false)
  }

  return sortNewest(offers)
}

export async function getOfferById(id) {
  return getDocument('offers', id)
}

export async function createOffer(data) {
  const normalized = {
    ...data,
    code: String(data.code || '').trim().toUpperCase(),
    title: String(data.title || '').trim(),
    description: String(data.description || '').trim(),
    discountType: data.discountType === 'fixed' ? 'fixed' : 'percentage',
    discountValue: Number(data.discountValue || 0),
    minOrderAmount: Number(data.minOrderAmount || 0),
    startDate: data.startDate || null,
    endDate: data.endDate || null,
    isActive: data.isActive !== false,
    showOnProduct: data.showOnProduct !== false,
  }
  return createDocument('offers', normalized)
}

export async function updateOffer(id, data) {
  const normalized = { ...data }
  if (data.code !== undefined) normalized.code = String(data.code).trim().toUpperCase()
  if (data.title !== undefined) normalized.title = String(data.title).trim()
  if (data.description !== undefined) normalized.description = String(data.description).trim()
  if (data.discountType !== undefined) normalized.discountType = data.discountType === 'fixed' ? 'fixed' : 'percentage'
  if (data.discountValue !== undefined) normalized.discountValue = Number(data.discountValue || 0)
  if (data.minOrderAmount !== undefined) normalized.minOrderAmount = Number(data.minOrderAmount || 0)
  if (data.startDate !== undefined) normalized.startDate = data.startDate || null
  if (data.endDate !== undefined) normalized.endDate = data.endDate || null
  if (data.isActive !== undefined) normalized.isActive = Boolean(data.isActive)
  if (data.showOnProduct !== undefined) normalized.showOnProduct = Boolean(data.showOnProduct)

  return updateDocument('offers', id, normalized)
}

export async function deleteOffer(id) {
  return deleteDocument('offers', id)
}

export async function validateCoupon(code, subtotal) {
  const searchCode = String(code || '').trim().toUpperCase()
  const sub = Number(subtotal || 0)

  const snapshot = await collectionRef('offers').get()
  const allOffers = snapshot.docs.map(mapDoc)
  const offer = allOffers.find((o) => String(o.code || '').toUpperCase() === searchCode)

  if (!offer) {
    return {
      valid: false,
      message: `Coupon code '${searchCode}' is invalid or does not exist.`,
    }
  }

  if (offer.isActive === false) {
    return {
      valid: false,
      message: `Coupon '${offer.code}' is currently inactive.`,
    }
  }

  const now = Date.now()
  if (offer.startDate) {
    const start = new Date(offer.startDate).getTime()
    if (!Number.isNaN(start) && start > now) {
      return {
        valid: false,
        message: `Coupon '${offer.code}' starts on ${new Date(offer.startDate).toLocaleDateString()}.`,
      }
    }
  }

  if (offer.endDate) {
    const end = new Date(offer.endDate).getTime()
    if (!Number.isNaN(end) && end < now) {
      return {
        valid: false,
        message: `Coupon '${offer.code}' expired on ${new Date(offer.endDate).toLocaleDateString()}.`,
      }
    }
  }

  const minRequired = Number(offer.minOrderAmount || 0)
  if (minRequired > 0 && sub < minRequired) {
    return {
      valid: false,
      message: `Coupon '${offer.code}' requires a minimum order of ₹${minRequired}. Current subtotal is ₹${sub}.`,
    }
  }

  let discountAmount = 0
  if (offer.discountType === 'percentage') {
    discountAmount = Math.round((sub * Number(offer.discountValue || 0)) / 100)
  } else {
    discountAmount = Math.min(sub, Number(offer.discountValue || 0))
  }

  const finalTotal = Math.max(0, sub - discountAmount)

  return {
    valid: true,
    code: offer.code,
    title: offer.title,
    description: offer.description,
    discountType: offer.discountType,
    discountValue: offer.discountValue,
    discountAmount,
    finalTotal,
    message: `Coupon '${offer.code}' applied successfully! You saved ₹${discountAmount}.`,
  }
}
