import express from 'express';
import { unifiedTaskController } from '../controllers/unified-task.controller.js';

const router = express.Router();

router.post('/', unifiedTaskController.createTask);
router.get('/next-task', unifiedTaskController.getNextTask);
router.post('/report', unifiedTaskController.reportTask);
router.get('/project/:projectId', unifiedTaskController.getProjectTasks);
router.delete('/:id', unifiedTaskController.deleteTask);
router.post('/clear-completed/:projectId', unifiedTaskController.clearCompleted);

export default router;
