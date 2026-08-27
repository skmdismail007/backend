import {
  deleteMessage,
  deleteAddressByAdmin,
  deleteOrderByAdmin,
  deleteQuote,
  deleteReview,
  deleteUserByAdmin,
  getDashboardSummary,
  getUserDetails,
  listAddresses,
  listAllReviews,
  listOrders,
  listUsers,
  updateMessageStatus,
  updateAddressByAdmin,
  updateOrderByAdmin,
  updateOrderStatus,
  updateQuoteStatus,
  updateReviewApproval,
  updateUserByAdmin,
} from '../services/adminService.js'
import { listContactMessages, listQuoteRequests } from '../services/customerService.js'
import { uploadSiteImage } from '../services/imageService.js'
import { getSiteSettings, updateSiteSettings } from '../services/siteSettingsService.js'

const MAX_SITE_HERO_IMAGES = 3

function normalizeHeroImages(settings = {}) {
  if (!Array.isArray(settings.heroImages)) return []

  return [
    ...new Set(
      settings.heroImages
        .map((image) => (typeof image === 'string' ? image.trim() : ''))
        .filter(Boolean),
    ),
  ].slice(0, MAX_SITE_HERO_IMAGES)
}

export async function getAdminSummary(_request, response) {
  response.json(await getDashboardSummary())
}

export async function getAdminSiteSettings(_request, response) {
  response.json(await getSiteSettings())
}

export async function patchAdminSiteSettings(request, response) {
  response.json(await updateSiteSettings(request.validated.body))
}

export async function postAdminSiteImages(request, response) {
  const files = request.files || []

  if (!files.length) {
    return response.status(400).json({ message: 'No files uploaded' })
  }

  const currentSettings = await getSiteSettings()
  const currentImages = normalizeHeroImages(currentSettings)

  if (currentImages.length + files.length > MAX_SITE_HERO_IMAGES) {
    return response.status(400).json({
      message: `Cannot exceed ${MAX_SITE_HERO_IMAGES} homepage images. Current: ${currentImages.length}, trying to add: ${files.length}`,
    })
  }

  const uploadedUrls = await Promise.all(files.map((file) => uploadSiteImage(file, 'site')))
  const heroImages = [...currentImages, ...uploadedUrls].slice(0, MAX_SITE_HERO_IMAGES)
  const settings = await updateSiteSettings({
    heroImages,
    heroImage: heroImages[0] || currentSettings.heroImage,
  })

  response.status(201).json({
    message: `${uploadedUrls.length} homepage image(s) uploaded successfully`,
    images: uploadedUrls,
    settings,
  })
}

export async function postAdminSiteLogo(request, response) {
  if (!request.file) {
    return response.status(400).json({ message: 'No logo file uploaded' })
  }

  const logoUrl = await uploadSiteImage(request.file, 'branding')
  const settings = await updateSiteSettings({ logoUrl })

  response.status(201).json({
    message: 'Website logo uploaded successfully',
    logoUrl,
    settings,
  })
}

export async function getAdminReviews(_request, response) {
  response.json(await listAllReviews())
}

export async function patchAdminReview(request, response) {
  const review = await updateReviewApproval(
    request.validated.params.id,
    request.validated.body.isApproved,
  )
  response.json(review)
}

export async function removeAdminReview(request, response) {
  response.json(await deleteReview(request.validated.params.id))
}

export async function getAdminMessages(_request, response) {
  response.json(await listContactMessages())
}

export async function patchAdminMessage(request, response) {
  const message = await updateMessageStatus(
    request.validated.params.id,
    request.validated.body.status,
  )
  response.json(message)
}

export async function removeAdminMessage(request, response) {
  response.json(await deleteMessage(request.validated.params.id))
}

export async function getAdminQuotes(_request, response) {
  response.json(await listQuoteRequests())
}

export async function patchAdminQuote(request, response) {
  const quote = await updateQuoteStatus(
    request.validated.params.id,
    request.validated.body.status,
  )
  response.json(quote)
}

export async function removeAdminQuote(request, response) {
  response.json(await deleteQuote(request.validated.params.id))
}

export async function getAdminUsers(_request, response) {
  response.json(await listUsers())
}

export async function getAdminUserDetails(request, response) {
  response.json(await getUserDetails(request.validated.params.id))
}

export async function patchAdminUser(request, response) {
  response.json(await updateUserByAdmin(request.validated.params.id, request.validated.body))
}

export async function removeAdminUser(request, response) {
  response.json(await deleteUserByAdmin(request.validated.params.id))
}

export async function getAdminAddresses(_request, response) {
  response.json(await listAddresses())
}

export async function patchAdminAddress(request, response) {
  response.json(await updateAddressByAdmin(request.validated.params.id, request.validated.body))
}

export async function removeAdminAddress(request, response) {
  response.json(await deleteAddressByAdmin(request.validated.params.id))
}

export async function getAdminOrders(_request, response) {
  response.json(await listOrders())
}

export async function patchAdminOrder(request, response) {
  const order = await updateOrderStatus(
    request.validated.params.id,
    request.validated.body.status,
  )
  response.json(order)
}

export async function patchAdminOrderDetails(request, response) {
  response.json(await updateOrderByAdmin(request.validated.params.id, request.validated.body))
}

export async function removeAdminOrder(request, response) {
  response.json(await deleteOrderByAdmin(request.validated.params.id))
}
