import { Router } from 'express'
import {
  getProduct,
  getProducts,
  patchProduct,
  postProduct,
  removeProduct,
} from '../controllers/productController.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { validate } from '../middleware/validate.js'
import {
  productCreateSchema,
  productIdSchema,
  productListSchema,
  productUpdateSchema,
} from '../validators/productSchemas.js'

const router = Router()

router.get('/', validate(productListSchema), asyncHandler(getProducts))
router.post('/', validate(productCreateSchema), asyncHandler(postProduct))
router.get('/:id', validate(productIdSchema), asyncHandler(getProduct))
router.patch('/:id', validate(productUpdateSchema), asyncHandler(patchProduct))
router.delete('/:id', validate(productIdSchema), asyncHandler(removeProduct))

export default router
