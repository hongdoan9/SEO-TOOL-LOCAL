import express from 'express';
import {
  getSchemas,
  saveSchema,
  seedPresets,
  getProfiles,
  createTask,
  bulkCreateTasks,
  retryTask,
  deleteProfile,
  getNextAgentTask,
  reportAgentTask
} from '../controllers/profile-creation.controller.js';

const router = express.Router();

// Route cho Dashboard / UI Management
router.get('/schemas', getSchemas);
router.post('/schemas', saveSchema);
router.post('/schemas/seed', seedPresets);
router.get('/profiles/:projectId', getProfiles);
router.post('/tasks', createTask);
router.post('/tasks/bulk', bulkCreateTasks);
router.post('/tasks/retry', retryTask);
router.delete('/profiles/:id', deleteProfile);

// Route cho Chrome Extension (Agent)
router.get('/agent/next-task', getNextAgentTask);
router.post('/agent/report', reportAgentTask);

export default router;
