import { Router } from 'express'
import { getSearchResults } from '../controllers/searchController.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { validate } from '../middleware/validate.js'
import { searchSchema } from '../validators/searchSchemas.js'

const router = Router()

router.get('/', validate(searchSchema), asyncHandler(getSearchResults))

export default router
