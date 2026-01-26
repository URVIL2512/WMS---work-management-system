import express from 'express';
import {
  getCompletedJobs,
  markReadyForDispatch,
  getCompletedJob
} from '../controllers/completedJobs.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.route('/')
  .get(getCompletedJobs);

router.route('/:id')
  .get(getCompletedJob);

router.route('/:id/ready')
  .put(markReadyForDispatch);

export default router;
