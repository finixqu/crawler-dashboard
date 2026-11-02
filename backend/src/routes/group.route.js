import express from 'express';

import groupController from '../controllers/group.controller.js';

const router = express.Router()

router.get('/', groupController.getGroups);
router.get('/:id/projects', groupController.readGroupProjects);


export default router