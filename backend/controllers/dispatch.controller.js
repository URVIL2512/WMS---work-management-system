import Dispatch from '../models/Dispatch.model.js';
import Order from '../models/Order.model.js';
import { logAudit } from '../utils/auditLogger.js';
import { handleDispatchCreated } from '../utils/orderAutomation.js';
import { ORDER_STATUSES } from '../utils/orderStatusTransitions.js';

// @desc    Create dispatch
// @route   POST /api/dispatch
// @access  Private
export const createDispatch = async (req, res, next) => {
  try {
    const { orderId, transportName, lrNumber, dispatchDate } = req.body;

    // Verify order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Block dispatch if order status is not Ready For Dispatch
    if (order.status !== ORDER_STATUSES.READY_FOR_DISPATCH) {
      return res.status(400).json({
        success: false,
        message: `Cannot create dispatch. Order status must be "Ready For Dispatch". Current status: ${order.status}`
      });
    }

    // Check if dispatch already exists
    const existing = await Dispatch.findOne({ orderId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Dispatch already exists for this order'
      });
    }

    const dispatch = await Dispatch.create({
      orderId,
      transportName,
      lrNumber,
      dispatchDate: dispatchDate || new Date(),
      dispatchedBy: req.user._id,
      status: 'Dispatched'
    });

    // Auto-update order status: Ready For Dispatch -> Dispatched
    const dispatchInfo = {
      vehicleNumber: transportName || '',
      lrNumber: lrNumber || '',
      driverName: '', // Can be added later
      dispatchDate: dispatchDate || new Date()
    };
    await handleDispatchCreated(orderId, req.user._id, dispatchInfo);

    // Log audit
    await logAudit(req.user._id, 'Create', 'Dispatch', dispatch._id);

    res.status(201).json({
      success: true,
      message: 'Order dispatched successfully',
      data: dispatch
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dispatch history
// @route   GET /api/dispatch/history
// @access  Private
export const getDispatchHistory = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};

    if (startDate || endDate) {
      filter.dispatchDate = {};
      if (startDate) filter.dispatchDate.$gte = new Date(startDate);
      if (endDate) filter.dispatchDate.$lte = new Date(endDate);
    }

    const dispatches = await Dispatch.find(filter)
      .populate('orderId', 'orderId soNumber customerName itemName')
      .populate('dispatchedBy', 'name email')
      .sort({ dispatchDate: -1 });

    res.status(200).json({
      success: true,
      count: dispatches.length,
      data: dispatches
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single dispatch
// @route   GET /api/dispatch/:orderId
// @access  Private
export const getDispatch = async (req, res, next) => {
  try {
    const dispatch = await Dispatch.findOne({ orderId: req.params.orderId })
      .populate('orderId', 'orderId soNumber customerName itemName')
      .populate('dispatchedBy', 'name email');

    if (!dispatch) {
      return res.status(404).json({
        success: false,
        message: 'Dispatch not found'
      });
    }

    res.status(200).json({
      success: true,
      data: dispatch
    });
  } catch (error) {
    next(error);
  }
};
