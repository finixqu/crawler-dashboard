import express from 'express';

import jobController from '../controllers/job.controller.js'

const router = express.Router()



router.post('/project', jobController.createProjectJob)
router.get('/', jobController.getJobs)


export default router