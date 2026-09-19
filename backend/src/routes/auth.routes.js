import express from 'express';
import { getAuthUrlController, googleCallbackController, getStatusController } from '../controllers/auth.controller.js';

const router = express.Router();

router.get('/auth-url/:projectId', getAuthUrlController);
router.get('/callback', googleCallbackController);
router.get('/status/:projectId', getStatusController);

export default router;
