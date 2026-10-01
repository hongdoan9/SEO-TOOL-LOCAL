import express from 'express';
import { getConfig, saveConfig, submitUrls, getHistory, clearHistory } from '../controllers/indexing.controller.js';

const router = express.Router();

router.get('/config/:projectId', getConfig);
router.post('/config/:projectId', saveConfig);
router.post('/submit/:projectId', submitUrls);
router.get('/history/:projectId', getHistory);
router.delete('/history/:projectId', clearHistory);

export default router;
