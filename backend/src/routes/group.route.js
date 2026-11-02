import express from 'express';

import groupController from '../controllers/group.controller.js';

const router = express.Router()

router.get('/', groupController.getGroups);


export default router