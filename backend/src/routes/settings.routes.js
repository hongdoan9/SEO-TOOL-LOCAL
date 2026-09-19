import express from 'express';
import { getSettings, saveSettings } from '../controllers/settings.controller.js';

const router = express.Router();

router.get('/:projectId', getSettings);
router.post('/:projectId', saveSettings);

export default router;
