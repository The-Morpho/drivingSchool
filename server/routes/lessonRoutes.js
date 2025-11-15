import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { getAll, getById, create, update, delete_, getAvailableInstructors } from '../controllers/lessonController.js';

const router = express.Router();

// Public routes
router.get('/', authenticate, getAll);
router.get('/:id', authenticate, getById);
router.get('/available-instructors/:customer_id', authenticate, getAvailableInstructors);

// Protected routes (admin, manager)
router.post('/', authenticate, create);
router.put('/:id', authenticate, update);
router.delete('/:id', authenticate, delete_);

export default router;