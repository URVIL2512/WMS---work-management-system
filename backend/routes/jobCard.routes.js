import express from 'express';
import {
  createJobCard,
  getJobCards,
  updateJobCardStatus
} from '../controllers/jobCard.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.route('/')
  .post(createJobCard)
  .get(getJobCards);

router.route('/:id/status')
  .put(updateJobCardStatus);

export default router;
