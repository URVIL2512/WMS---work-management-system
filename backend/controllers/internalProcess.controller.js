import InternalProcess from '../models/InternalProcess.model.js';
import Order from '../models/Order.model.js';
import { logAudit } from '../utils/auditLogger.js';

// Process steps in order
const PROCESS_STEPS = ['balancing', 'cleaning', 'assembly', 'packaging'];

// @desc    Create internal process
// @route   POST /api/internal-process
// @access  Private
export const createInternalProcess = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    // Verify order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if internal process already exists
    const existing = await InternalProcess.findOne({ orderId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Internal process already exists for this order'
      });
    }

    const internalProcess = await InternalProcess.create({
      orderId
    });

    // Log audit
    await logAudit(req.user._id, 'Create', 'InternalProcess', internalProcess._id);

    res.status(201).json({
      success: true,
      message: 'Internal process created successfully',
      data: internalProcess
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update internal process step
// @route   PUT /api/internal-process/:orderId
// @access  Private
export const updateInternalProcess = async (req, res, next) => {
  try {
    const { step } = req.body;

    if (!PROCESS_STEPS.includes(step)) {
      return res.status(400).json({
        success: false,
        message: `Invalid step. Must be one of: ${PROCESS_STEPS.join(', ')}`
      });
    }

    let internalProcess = await InternalProcess.findOne({ orderId: req.params.orderId });

    if (!internalProcess) {
      // Create if doesn't exist
      internalProcess = await InternalProcess.create({
        orderId: req.params.orderId
      });
    }

    // Check if previous steps are completed
    const stepIndex = PROCESS_STEPS.indexOf(step);
    if (stepIndex > 0) {
      const previousStep = PROCESS_STEPS[stepIndex - 1];
      if (!internalProcess[previousStep].completed) {
        return res.status(400).json({
          success: false,
          message: `Previous step ${previousStep} must be completed first`
        });
      }
    }

    // Update the step
    internalProcess[step] = {
      completed: true,
      completedBy: req.user._id,
      completedAt: new Date()
    };

    await internalProcess.save();

    // Log audit
    await logAudit(req.user._id, 'Update', 'InternalProcess', internalProcess._id, { step });

    res.status(200).json({
      success: true,
      message: `${step} step completed successfully`,
      data: internalProcess
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get internal process
// @route   GET /api/internal-process/:orderId
// @access  Private
export const getInternalProcess = async (req, res, next) => {
  try {
    const internalProcess = await InternalProcess.findOne({ orderId: req.params.orderId })
      .populate('balancing.completedBy', 'name email')
      .populate('cleaning.completedBy', 'name email')
      .populate('assembly.completedBy', 'name email')
      .populate('packaging.completedBy', 'name email');

    if (!internalProcess) {
      return res.status(404).json({
        success: false,
        message: 'Internal process not found'
      });
    }

    res.status(200).json({
      success: true,
      data: internalProcess
    });
  } catch (error) {
    next(error);
  }
};
