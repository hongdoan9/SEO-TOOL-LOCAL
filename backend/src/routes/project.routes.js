import express from 'express';
import { getProjects, createProject, deleteProject } from '../controllers/project.controller.js';

const router = express.Router();

router.get('/:userId', getProjects);
router.post('/', createProject);
router.delete('/:id', deleteProject);

export default router;
