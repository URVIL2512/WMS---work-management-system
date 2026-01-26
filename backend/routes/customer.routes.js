import express from 'express';
import * as customerController from '../controllers/customer.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get active customers (for dropdowns)
router.get('/active', customerController.getActiveCustomers);

// Get all customers
router.get('/', customerController.getAllCustomers);

// Get customer by ID
router.get('/:id', customerController.getCustomerById);

// Create customer
router.post('/', customerController.createCustomer);

// Update customer
router.put('/:id', customerController.updateCustomer);

// Update customer status
router.patch('/:id/status', customerController.updateCustomerStatus);

// Delete customer (Admin only - add admin check if needed)
router.delete('/:id', customerController.deleteCustomer);

export default router;
