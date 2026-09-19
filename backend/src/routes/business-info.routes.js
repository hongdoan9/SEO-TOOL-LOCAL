import express from 'express';
import { getBusinessInfo, saveBusinessInfo } from '../controllers/business-info.controller.js';

const router = express.Router();

router.get('/:projectId', getBusinessInfo);
router.post('/:projectId', saveBusinessInfo);

export default router;
