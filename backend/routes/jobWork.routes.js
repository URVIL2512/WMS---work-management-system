import express from 'express';
import {
  createJobWork,
  getJobWorks,
  receiveJobWork
} from '../controllers/jobWork.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.route('/')
  .post(createJobWork)
  .get(getJobWorks);

router.route('/:id/receive')
  .put(receiveJobWork);

export default router;
