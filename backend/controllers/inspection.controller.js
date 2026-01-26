import Inspection from '../models/Inspection.model.js';
import Order from '../models/Order.model.js';
import CompletedJob from '../models/CompletedJob.model.js';
import InternalProcess from '../models/InternalProcess.model.js';
import { logAudit } from '../utils/auditLogger.js';
import { checkProductionCompletion } from '../utils/orderAutomation.js';

// @desc    Create inspection
// @route   POST /api/inspection
// @access  Private
export const createInspection = async (req, res, next) => {
  try {
    const { orderId, inspectorName, result, remarks } = req.body;

    // Verify order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if inspection already exists
    const existing = await Inspection.findOne({ orderId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Inspection already exists for this order'
      });
    }

    const inspection = await Inspection.create({
      orderId,
      inspectorName,
      result,
      remarks,
      inspectedAt: new Date(),
      inspectedBy: req.user._id
    });

    // If Pass, check if all production stages are completed
    if (result === 'Pass') {
      await CompletedJob.create({
        orderId,
        completedDate: new Date(),
        status: 'Ready For Dispatch'
      });
      // Check production completion (will auto-update to Ready For Dispatch if all conditions met)
      await checkProductionCompletion(orderId, req.user._id);
    } else {
      // If Fail, reset internal process (remove completion flags)
      const internalProcess = await InternalProcess.findOne({ orderId });
      if (internalProcess) {
        // Reset all processes
        internalProcess.balancing.completed = false;
        internalProcess.cleaning.completed = false;
        internalProcess.assembly.completed = false;
        internalProcess.packaging.completed = false;
        await internalProcess.save();
      }
    }

    // Log audit
    await logAudit(req.user._id, 'Create', 'Inspection', inspection._id, { result });

    res.status(201).json({
      success: true,
      message: `Inspection ${result === 'Pass' ? 'passed' : 'failed'}`,
      data: inspection
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get inspection by order ID
// @route   GET /api/inspection/:orderId
// @access  Private
export const getInspection = async (req, res, next) => {
  try {
    const inspection = await Inspection.findOne({ orderId: req.params.orderId })
      .populate('inspectedBy', 'name email')
      .populate('orderId', 'orderId soNumber');

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: 'Inspection not found'
      });
    }

    res.status(200).json({
      success: true,
      data: inspection
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all inspections
// @route   GET /api/inspection
// @access  Private
export const getInspections = async (req, res, next) => {
  try {
    const inspections = await Inspection.find()
      .populate('inspectedBy', 'name email')
      .populate('orderId', 'orderId soNumber')
      .sort({ inspectedAt: -1 });

    res.status(200).json({
      success: true,
      count: inspections.length,
      data: inspections
    });
  } catch (error) {
    next(error);
  }
};
