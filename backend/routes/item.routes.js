import express from 'express';
import * as itemController from '../controllers/item.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes
router.post('/', itemController.createItem);
router.get('/', itemController.getAllItems);
router.get('/active', itemController.getActiveItems);
router.get('/:id', itemController.getItemById);
router.put('/:id', itemController.updateItem);
router.patch('/:id/status', itemController.updateItemStatus);
router.delete('/:id', itemController.deleteItem);

export default router;
