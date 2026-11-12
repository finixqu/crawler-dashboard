import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'

import authController from '../controllers/auth.controller.js'
import authMiddleware from '../middleware/auth.middleware.js'

const router = Router()

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Terlalu banyak percobaan login. Coba lagi nanti.'
    }
})

router.post('/login', loginLimiter, authController.login)

router.post('/refresh', authController.refresh)

router.get('/me', authMiddleware, authController.me)

router.post('/logout', authController.logout)

export default router