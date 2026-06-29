import { Router } from 'express'
import {
  getAdminMessages,
  getAdminQuotes,
  getAdminReviews,
  getAdminSiteSettings,
  getAdminSummary,
  getAdminAddresses,
  getAdminOrders,
  getAdminUserDetails,
  getAdminUsers,
  patchAdminAddress,
  patchAdminMessage,
  patchAdminOrder,
  patchAdminOrderDetails,
  patchAdminQuote,
  patchAdminReview,
  patchAdminSiteSettings,
  patchAdminUser,
  postAdminSiteImages,
  removeAdminAddress,
  removeAdminMessage,
  removeAdminOrder,
  removeAdminQuote,
  removeAdminReview,
  removeAdminUser,
} from '../controllers/adminController.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { handleUploadError, uploadSiteImages, validateSiteImageCount } from '../middleware/upload.js'
import { validate } from '../middleware/validate.js'
import {
  adminIdSchema,
  adminAddressUpdateSchema,
  adminOrderUpdateSchema,
  adminOrderStatusSchema,
  adminReviewUpdateSchema,
  adminSiteSettingsSchema,
  adminStatusSchema,
  adminUserUpdateSchema,
} from '../validators/adminSchemas.js'

const router = Router()

router.get('/summary', asyncHandler(getAdminSummary))
router.get('/site-settings', asyncHandler(getAdminSiteSettings))
router.patch('/site-settings', validate(adminSiteSettingsSchema), asyncHandler(patchAdminSiteSettings))
router.post(
  '/site-settings/images',
  uploadSiteImages.array('images', 5),
  validateSiteImageCount,
  asyncHandler(postAdminSiteImages),
  handleUploadError,
)
router.get('/reviews', asyncHandler(getAdminReviews))
router.patch('/reviews/:id', validate(adminReviewUpdateSchema), asyncHandler(patchAdminReview))
router.delete('/reviews/:id', validate(adminIdSchema), asyncHandler(removeAdminReview))
router.get('/messages', asyncHandler(getAdminMessages))
router.patch('/messages/:id', validate(adminStatusSchema), asyncHandler(patchAdminMessage))
router.delete('/messages/:id', validate(adminIdSchema), asyncHandler(removeAdminMessage))
router.get('/quotes', asyncHandler(getAdminQuotes))
router.patch('/quotes/:id', validate(adminStatusSchema), asyncHandler(patchAdminQuote))
router.delete('/quotes/:id', validate(adminIdSchema), asyncHandler(removeAdminQuote))
router.get('/users', asyncHandler(getAdminUsers))
router.get('/users/:id/details', validate(adminIdSchema), asyncHandler(getAdminUserDetails))
router.patch('/users/:id', validate(adminUserUpdateSchema), asyncHandler(patchAdminUser))
router.delete('/users/:id', validate(adminIdSchema), asyncHandler(removeAdminUser))
router.get('/addresses', asyncHandler(getAdminAddresses))
router.patch('/addresses/:id', validate(adminAddressUpdateSchema), asyncHandler(patchAdminAddress))
router.delete('/addresses/:id', validate(adminIdSchema), asyncHandler(removeAdminAddress))
router.get('/orders', asyncHandler(getAdminOrders))
router.patch('/orders/:id', validate(adminOrderStatusSchema), asyncHandler(patchAdminOrder))
router.patch('/orders/:id/details', validate(adminOrderUpdateSchema), asyncHandler(patchAdminOrderDetails))
router.delete('/orders/:id', validate(adminIdSchema), asyncHandler(removeAdminOrder))

export default router
