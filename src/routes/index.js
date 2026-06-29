import { Router } from 'express'
import healthRoutes from './healthRoutes.js'
import productRoutes from './productRoutes.js'
import serviceRoutes from './serviceRoutes.js'
import customerRoutes from './customerRoutes.js'
import searchRoutes from './searchRoutes.js'
import adminRoutes from './adminRoutes.js'
import siteSettingsRoutes from './siteSettingsRoutes.js'

const router = Router()

router.use('/health', healthRoutes)
router.use('/products', productRoutes)
router.use('/services', serviceRoutes)
router.use('/customers', customerRoutes)
router.use('/search', searchRoutes)
router.use('/site-settings', siteSettingsRoutes)
router.use('/admin', adminRoutes)

export default router
