import express from 'express';
import {
  createMaster,
  getMasters,
  updateMaster,
  deleteMaster
} from '../controllers/masters.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.route('/:type')
  .post(createMaster)
  .get(getMasters);

router.route('/:type/:id')
  .put(updateMaster)
  .delete(deleteMaster);

export default router;
