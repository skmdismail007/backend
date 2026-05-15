import { Router } from 'express'
import {
  getAdminMessages,
  getAdminQuotes,
  getAdminReviews,
  getAdminSummary,
  getAdminAddresses,
  getAdminOrders,
  getAdminUserDetails,
  getAdminUsers,
  patchAdminMessage,
  patchAdminOrder,
  patchAdminQuote,
  patchAdminReview,
  removeAdminMessage,
  removeAdminQuote,
  removeAdminReview,
} from '../controllers/adminController.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { validate } from '../middleware/validate.js'
import {
  adminIdSchema,
  adminOrderStatusSchema,
  adminReviewUpdateSchema,
  adminStatusSchema,
} from '../validators/adminSchemas.js'

const router = Router()

router.get('/summary', asyncHandler(getAdminSummary))
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
router.get('/addresses', asyncHandler(getAdminAddresses))
router.get('/orders', asyncHandler(getAdminOrders))
router.patch('/orders/:id', validate(adminOrderStatusSchema), asyncHandler(patchAdminOrder))

export default router
