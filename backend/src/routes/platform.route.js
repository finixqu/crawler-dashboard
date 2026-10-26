import express from 'express'


import platformController from '../controllers/platform.controller.js'

const router = express.Router()

router.get('/', platformController.getPlatforms)

export default router;