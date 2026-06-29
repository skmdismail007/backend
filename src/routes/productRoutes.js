import { Router } from 'express'
import {
  getProduct,
  getProducts,
  patchProduct,
  postProduct,
  removeProduct,
} from '../controllers/productController.js'
import {
  postProductImages,
  deleteProductImageByUrl,
  patchProductImageOrder,
} from '../controllers/imageController.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { validate } from '../middleware/validate.js'
import { uploadProductImages, validateImageCount, handleUploadError } from '../middleware/upload.js'
import {
  productCreateSchema,
  productIdSchema,
  productListSchema,
  productUpdateSchema,
  productImageUploadSchema,
  productImageDeleteSchema,
  productImageReorderSchema,
} from '../validators/productSchemas.js'

const router = Router()

router.get('/', validate(productListSchema), asyncHandler(getProducts))
router.post('/', validate(productCreateSchema), asyncHandler(postProduct))
router.get('/:id', validate(productIdSchema), asyncHandler(getProduct))
router.patch('/:id', validate(productUpdateSchema), asyncHandler(patchProduct))
router.delete('/:id', validate(productIdSchema), asyncHandler(removeProduct))

// Image management routes
router.post(
  '/:id/images',
  uploadProductImages.array('images', 10),
  validateImageCount,
  validate(productImageUploadSchema),
  asyncHandler(postProductImages),
  handleUploadError,
)
router.delete(
  '/:id/images',
  validate(productImageDeleteSchema),
  asyncHandler(deleteProductImageByUrl),
)
router.patch(
  '/:id/images/reorder',
  validate(productImageReorderSchema),
  asyncHandler(patchProductImageOrder),
)

export default router
