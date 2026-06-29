import { Router } from 'express'
import { getHomeSiteSettings } from '../controllers/siteSettingsController.js'
import { asyncHandler } from '../middleware/asyncHandler.js'

const router = Router()

router.get('/home', asyncHandler(getHomeSiteSettings))

export default router
