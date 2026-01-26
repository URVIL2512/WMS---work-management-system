import express from 'express';
import {
  createDispatch,
  getDispatchHistory,
  getDispatch
} from '../controllers/dispatch.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.route('/')
  .post(createDispatch);

router.route('/history')
  .get(getDispatchHistory);

router.route('/:orderId')
  .get(getDispatch);

export default router;
