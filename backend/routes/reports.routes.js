import express from 'express';
import {
  getOrdersReport,
  getProductionReport,
  getVendorReport,
  getDispatchReport
} from '../controllers/reports.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/orders', getOrdersReport);
router.get('/production', getProductionReport);
router.get('/vendor', getVendorReport);
router.get('/dispatch', getDispatchReport);

export default router;
