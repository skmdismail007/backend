import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { validate } from '../middleware/validate.js'
import { getFile } from '../controllers/fileController.js'
import { fileIdSchema } from '../validators/fileSchemas.js'

const router = Router()

router.get('/:id', validate(fileIdSchema), asyncHandler(getFile))

export default router
