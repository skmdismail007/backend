import { Router } from 'express'
import {
  getService,
  getServices,
  patchService,
  postService,
  removeService,
} from '../controllers/serviceController.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { validate } from '../middleware/validate.js'
import {
  serviceCreateSchema,
  serviceIdSchema,
  serviceUpdateSchema,
} from '../validators/serviceSchemas.js'

const router = Router()

router.get('/', asyncHandler(getServices))
router.post('/', validate(serviceCreateSchema), asyncHandler(postService))
router.get('/:id', validate(serviceIdSchema), asyncHandler(getService))
router.patch('/:id', validate(serviceUpdateSchema), asyncHandler(patchService))
router.delete('/:id', validate(serviceIdSchema), asyncHandler(removeService))

export default router
