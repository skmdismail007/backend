import { Router } from 'express'
import {
  getPublicOffers,
  postValidateCoupon,
  getAdminOffers,
  getAdminOffer,
  postAdminOffer,
  patchAdminOffer,
  removeAdminOffer,
} from '../controllers/offerController.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { validate } from '../middleware/validate.js'
import {
  offerCreateSchema,
  offerIdSchema,
  offerUpdateSchema,
  offerValidateSchema,
} from '../validators/offerSchemas.js'

const router = Router()

// Public routes for frontend
router.get('/', asyncHandler(getPublicOffers))
router.post('/validate', validate(offerValidateSchema), asyncHandler(postValidateCoupon))

// Admin management routes
router.get('/all', asyncHandler(getAdminOffers))
router.get('/:id', validate(offerIdSchema), asyncHandler(getAdminOffer))
router.post('/', validate(offerCreateSchema), asyncHandler(postAdminOffer))
router.patch('/:id', validate(offerUpdateSchema), asyncHandler(patchAdminOffer))
router.delete('/:id', validate(offerIdSchema), asyncHandler(removeAdminOffer))

export default router
