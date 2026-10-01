import express from 'express';
import userRoutes from './user.routes.js';
import projectRoutes from './project.routes.js';
import settingsRoutes from './settings.routes.js';
import businessInfoRoutes from './business-info.routes.js';
import authRoutes from './auth.routes.js';
import googleStackRoutes from './google-stack.routes.js';
import systemRoutes from './system.routes.js';
import profileCreationRoutes from './profile-creation.routes.js';
import unifiedTaskRoutes from './unified-task.routes.js';
import indexingRoutes from './indexing.routes.js';

const router = express.Router();
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/settings', settingsRoutes);
router.use('/business-info', businessInfoRoutes);
router.use('/google', authRoutes);
router.use('/google-stacks', googleStackRoutes);
router.use('/profile-creation', profileCreationRoutes);
router.use('/system-tasks', unifiedTaskRoutes);
router.use('/indexing', indexingRoutes);
router.use('/', systemRoutes);

export default router;