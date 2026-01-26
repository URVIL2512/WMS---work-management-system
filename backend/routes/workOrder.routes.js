import express from 'express';
import {
  createWorkOrder,
  getWorkOrders,
  getWorkOrder
} from '../controllers/workOrder.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.route('/')
  .post(createWorkOrder)
  .get(getWorkOrders);

router.route('/:id')
  .get(getWorkOrder);

export default router;
