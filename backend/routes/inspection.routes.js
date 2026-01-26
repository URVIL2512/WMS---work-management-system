import express from 'express';
import {
  createInspection,
  getInspection,
  getInspections
} from '../controllers/inspection.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.route('/')
  .post(createInspection)
  .get(getInspections);

router.route('/:orderId')
  .get(getInspection);

export default router;
