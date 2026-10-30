import express from 'express';

import jobController from '../controllers/job.controller.js'

const router = express.Router()



router.post('/project', jobController.createProjectJob)
router.post('/:id/stop', jobController.stopJobCrawler)

router.get('/', jobController.getJobs)
router.get('/:id/log', jobController.getJobLog)

export default router