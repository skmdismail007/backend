import { Router } from 'express'
import {
  getContactMessages,
  getQuoteRequests,
  getReviews,
  getUserAddresses,
  getUserOrders,
  patchUser,
  patchUserDefaultAddress,
  postContactMessage,
  postQuoteRequest,
  postReview,
  postUserAddress,
  postUserLogin,
  postUserOrder,
  postUserRegister,
  removeUserAddress,
} from '../controllers/customerController.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { validate } from '../middleware/validate.js'
import {
  contactCreateSchema,
  addressCreateSchema,
  addressIdSchema,
  orderCreateSchema,
  quoteCreateSchema,
  reviewCreateSchema,
  userIdSchema,
  userLoginSchema,
  userRegisterSchema,
  userUpdateSchema,
} from '../validators/customerSchemas.js'

const router = Router()

router.get('/reviews', asyncHandler(getReviews))
router.post('/reviews', validate(reviewCreateSchema), asyncHandler(postReview))
router.get('/messages', asyncHandler(getContactMessages))
router.post('/messages', validate(contactCreateSchema), asyncHandler(postContactMessage))
router.get('/quotes', asyncHandler(getQuoteRequests))
router.post('/quotes', validate(quoteCreateSchema), asyncHandler(postQuoteRequest))
router.post('/users/register', validate(userRegisterSchema), asyncHandler(postUserRegister))
router.post('/users/login', validate(userLoginSchema), asyncHandler(postUserLogin))
router.patch('/users/:id', validate(userUpdateSchema), asyncHandler(patchUser))
router.get('/users/:id/addresses', validate(userIdSchema), asyncHandler(getUserAddresses))
router.post('/users/:id/addresses', validate(addressCreateSchema), asyncHandler(postUserAddress))
router.patch('/users/:id/addresses/:addressId/default', validate(addressIdSchema), asyncHandler(patchUserDefaultAddress))
router.delete('/users/:id/addresses/:addressId', validate(addressIdSchema), asyncHandler(removeUserAddress))
router.get('/users/:id/orders', validate(userIdSchema), asyncHandler(getUserOrders))
router.post('/users/:id/orders', validate(orderCreateSchema), asyncHandler(postUserOrder))

export default router
