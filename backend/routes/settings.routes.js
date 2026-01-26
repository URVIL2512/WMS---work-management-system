import express from 'express';
import {
  getSettings,
  updateSettings
} from '../controllers/settings.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.route('/')
  .get(getSettings)
  .put(updateSettings);

export default router;
