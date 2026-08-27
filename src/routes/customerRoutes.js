import { Router } from 'express'
import {
  getContactMessages,
  getQuoteRequests,
  getReviews,
  getUserAddresses,
  getUserOrders,
  patchUser,
  patchUserDefaultAddress,
  patchUserCancelOrder,
  postFreelanceRequest,
  postContactMessage,
  postQuoteRequest,
  postReview,
  postUserAddress,
  postUserLogin,
  postUserOrder,
  postUserRegister,
  patchUserAddress,
  removeUserAddress,
} from '../controllers/customerController.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { validate } from '../middleware/validate.js'
import {
  contactCreateSchema,
  addressCreateSchema,
  addressUpdateSchema,
  freelanceRequestCreateSchema,
  addressIdSchema,
  orderCreateSchema,
  orderCancelSchema,
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
router.post('/freelance-requests', validate(freelanceRequestCreateSchema), asyncHandler(postFreelanceRequest))
router.post('/users/register', validate(userRegisterSchema), asyncHandler(postUserRegister))
router.post('/users/login', validate(userLoginSchema), asyncHandler(postUserLogin))
router.patch('/users/:id', validate(userUpdateSchema), asyncHandler(patchUser))
router.get('/users/:id/addresses', validate(userIdSchema), asyncHandler(getUserAddresses))
router.post('/users/:id/addresses', validate(addressCreateSchema), asyncHandler(postUserAddress))
router.patch('/users/:id/addresses/:addressId', validate(addressUpdateSchema), asyncHandler(patchUserAddress))
router.patch('/users/:id/addresses/:addressId/default', validate(addressIdSchema), asyncHandler(patchUserDefaultAddress))
router.delete('/users/:id/addresses/:addressId', validate(addressIdSchema), asyncHandler(removeUserAddress))
router.get('/users/:id/orders', validate(userIdSchema), asyncHandler(getUserOrders))
router.post('/users/:id/orders', validate(orderCreateSchema), asyncHandler(postUserOrder))
router.patch('/users/:id/orders/:orderId/cancel', validate(orderCancelSchema), asyncHandler(patchUserCancelOrder))

export default router
