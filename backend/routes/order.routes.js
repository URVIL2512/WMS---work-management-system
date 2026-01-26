import express from 'express';
import {
  createOrder,
  getOrders,
  getOrder,
  updateOrder,
  deleteOrder,
  updateOrderStatus,
  confirmOrder,
  putOrderOnHold,
  cancelOrder,
  dispatchOrder,
  markDelivered,
  closeOrder,
  getOrderStats
} from '../controllers/order.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.route('/stats')
  .get(getOrderStats);

router.route('/')
  .post(createOrder)
  .get(getOrders);

router.route('/:id/confirm')
  .put(confirmOrder);

router.route('/:id/hold')
  .put(putOrderOnHold);

router.route('/:id/cancel')
  .put(cancelOrder);

router.route('/:id/dispatch')
  .put(dispatchOrder);

router.route('/:id/deliver')
  .put(markDelivered);

router.route('/:id/close')
  .put(closeOrder);

router.route('/:id/status')
  .put(updateOrderStatus);

router.route('/:id')
  .get(getOrder)
  .put(updateOrder)
  .delete(deleteOrder);

export default router;
