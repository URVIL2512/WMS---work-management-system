import express from 'express';
import {
  createInternalProcess,
  updateInternalProcess,
  getInternalProcess
} from '../controllers/internalProcess.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.route('/')
  .post(createInternalProcess);

router.route('/:orderId')
  .get(getInternalProcess)
  .put(updateInternalProcess);

export default router;
