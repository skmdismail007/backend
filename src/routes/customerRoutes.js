import { Router } from 'express'
import {
  getContactMessages,
  getQuoteRequests,
  getReviews,
  postContactMessage,
  postQuoteRequest,
  postReview,
} from '../controllers/customerController.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { validate } from '../middleware/validate.js'
import {
  contactCreateSchema,
  quoteCreateSchema,
  reviewCreateSchema,
} from '../validators/customerSchemas.js'

const router = Router()

router.get('/reviews', asyncHandler(getReviews))
router.post('/reviews', validate(reviewCreateSchema), asyncHandler(postReview))
router.get('/messages', asyncHandler(getContactMessages))
router.post('/messages', validate(contactCreateSchema), asyncHandler(postContactMessage))
router.get('/quotes', asyncHandler(getQuoteRequests))
router.post('/quotes', validate(quoteCreateSchema), asyncHandler(postQuoteRequest))

export default router
