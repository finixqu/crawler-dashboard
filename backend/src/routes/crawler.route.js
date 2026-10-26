import { Router } from 'express'

import { startCrawler } from "../controllers/crawler.controller.js";

const router = Router()

router.post('/start', startCrawler)

export default router