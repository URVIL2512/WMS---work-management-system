import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { getUserActivities, getAllActivities } from '../controllers/activity.controller.js';

const router = express.Router();

// Get current user's activities
router.get('/', authenticate, getUserActivities);

// Get all activities (Admin only)
router.get('/all', authenticate, authorize('Admin'), getAllActivities);

export default router;
