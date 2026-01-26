import express from 'express';
import {
  createQuotation,
  getQuotations,
  getQuotation,
  updateQuotation,
  deleteQuotation,
  sendQuotationEmail,
  approveQuotation,
  rejectQuotation,
  requestChangesQuotation,
  updateQuotationStatus,
  getNextQuotationNumber
} from '../controllers/quotation.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

// IMPORTANT: Specific routes must come BEFORE parameterized routes
router.get('/next-number', getNextQuotationNumber);

router.route('/')
  .post(createQuotation)
  .get(getQuotations);

// IMPORTANT: Specific routes must come BEFORE parameterized routes
// Otherwise Express will match /:id first and treat "send-email" as an ID
router.route('/:id/send-email')
  .post(sendQuotationEmail);

router.route('/:id/approve')
  .put(approveQuotation);

router.route('/:id/reject')
  .put(rejectQuotation);

router.route('/:id/request-changes')
  .put(requestChangesQuotation);

router.route('/:id/status')
  .patch(updateQuotationStatus);

router.route('/:id')
  .get(getQuotation)
  .put(updateQuotation)
  .delete(deleteQuotation);

export default router;
