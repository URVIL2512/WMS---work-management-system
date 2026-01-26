import express from 'express';
import { createInward } from '../controllers/inward.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.route('/')
  .post(createInward);

export default router;
