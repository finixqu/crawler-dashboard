import express from 'express';

import jobController from '../controllers/job.controller.js'

const router = express.Router()



router.post('/project', jobController.createProjectJob)
router.post('/group', jobController.createGroupJob)
router.post('/:id/stop', jobController.stopJobCrawler)

router.get('/', jobController.getJobs)
router.get('/:id/log', jobController.getJobLog)
router.get('/:id/project-logs', jobController.getGroupProjectLogs)
router.get('/:id/project-logs/:projectId', jobController.getGroupProjectLog)


export default router