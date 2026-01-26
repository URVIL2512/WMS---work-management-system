import WorkOrder from '../models/WorkOrder.model.js';
import Order from '../models/Order.model.js';
import JobCard from '../models/JobCard.model.js';
import JobWork from '../models/JobWork.model.js';
import { generateWorkOrderId, generateJobCardId, generateJobWorkId } from '../utils/generateId.js';
import { logAudit } from '../utils/auditLogger.js';
import { handleWorkOrderCreated } from '../utils/orderAutomation.js';

// Default processes for inhouse
const DEFAULT_INHOUSE_PROCESSES = [
  'Balancing',
  'Cleaning',
  'Assembly',
  'Packaging',
  'Quality Check'
];

// @desc    Create work order
// @route   POST /api/workorders
// @access  Private
export const createWorkOrder = async (req, res, next) => {
  try {
    const {
      orderId,
      itemName,
      quantity,
      selectedTypes,
      plannedProcesses,
      startDate,
      targetDate
    } = req.body;

    // Verify order exists and is in Confirmed status
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Block Work Order creation if order status is not Confirmed
    if (order.status !== 'Confirmed') {
      return res.status(400).json({
        success: false,
        message: `Cannot create work order. Order status must be "Confirmed". Current status: ${order.status}`
      });
    }

    // Block if order is on Hold or Cancelled
    if (order.status === 'On Hold' || order.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot create work order. Order is ${order.status}`
      });
    }

    const workOrderId = generateWorkOrderId();

    const workOrder = await WorkOrder.create({
      workOrderId,
      orderId,
      itemName,
      quantity,
      selectedTypes,
      plannedProcesses: plannedProcesses || [],
      startDate,
      targetDate,
      status: 'Planned',
      createdBy: req.user._id
    });

    // Auto create job cards or job works based on selectedTypes
    if (selectedTypes.includes('Inhouse')) {
      const processes = plannedProcesses.length > 0 ? plannedProcesses : DEFAULT_INHOUSE_PROCESSES;
      for (const process of processes) {
        await JobCard.create({
          jobCardId: generateJobCardId(),
          workOrderId: workOrder._id,
          processName: process,
          productName: itemName,
          quantity,
          status: 'Pending'
        });
      }
    }

    if (selectedTypes.includes('Outside')) {
      // Create job work entry (vendor details can be added later)
      await JobWork.create({
        jobWorkId: generateJobWorkId(),
        workOrderId: workOrder._id,
        vendorName: '', // To be updated
        process: plannedProcesses[0] || 'Outsourced',
        productName: itemName,
        quantitySent: quantity,
        status: 'Sent',
        createdBy: req.user._id
      });
    }

    // Log audit
    await logAudit(req.user._id, 'Create', 'WorkOrder', workOrder._id);

    // Auto-update order status: Confirmed -> In Production
    await handleWorkOrderCreated(orderId, req.user._id);

    res.status(201).json({
      success: true,
      message: 'Work order created successfully',
      data: workOrder
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all work orders
// @route   GET /api/workorders
// @access  Private
export const getWorkOrders = async (req, res, next) => {
  try {
    const { orderId, status } = req.query;
    const filter = {};
    if (orderId) filter.orderId = orderId;
    if (status) filter.status = status;

    const workOrders = await WorkOrder.find(filter)
      .populate('orderId', 'orderId soNumber customerName')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: workOrders.length,
      data: workOrders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single work order
// @route   GET /api/workorders/:id
// @access  Private
export const getWorkOrder = async (req, res, next) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id)
      .populate('orderId', 'orderId soNumber customerName')
      .populate('createdBy', 'name email');

    if (!workOrder) {
      return res.status(404).json({
        success: false,
        message: 'Work order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: workOrder
    });
  } catch (error) {
    next(error);
  }
};
