import express from 'express';
import { socialPbnController } from '../controllers/social-pbn.controller.js';

const router = express.Router();

router.get('/sites/:projectId', socialPbnController.getSites);
router.post('/sites/:projectId', socialPbnController.addSite);
router.delete('/sites/:id', socialPbnController.deleteSite);
router.post('/sites/test-connection', socialPbnController.testSiteConnection);

router.post('/publish/:projectId', socialPbnController.publishPost);
router.get('/history/:projectId', socialPbnController.getHistory);
router.delete('/history/:projectId', socialPbnController.clearHistory);

export default router;
