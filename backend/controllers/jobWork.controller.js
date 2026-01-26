import JobWork from '../models/JobWork.model.js';
import WorkOrder from '../models/WorkOrder.model.js';
import { generateJobWorkId } from '../utils/generateId.js';
import { logAudit } from '../utils/auditLogger.js';
import { checkProductionCompletion } from '../utils/orderAutomation.js';

// @desc    Create job work
// @route   POST /api/jobwork
// @access  Private
export const createJobWork = async (req, res, next) => {
  try {
    const {
      workOrderId,
      vendorName,
      challanNumber,
      process,
      productName,
      quantitySent
    } = req.body;

    const jobWork = await JobWork.create({
      jobWorkId: generateJobWorkId(),
      workOrderId,
      vendorName,
      challanNumber,
      process,
      productName,
      quantitySent,
      quantityReceived: 0,
      status: 'Sent',
      createdBy: req.user._id
    });

    // Log audit
    await logAudit(req.user._id, 'Create', 'JobWork', jobWork._id);

    res.status(201).json({
      success: true,
      message: 'Job work created successfully',
      data: jobWork
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all job works
// @route   GET /api/jobwork
// @access  Private
export const getJobWorks = async (req, res, next) => {
  try {
    const { workOrderId, status } = req.query;
    const filter = {};
    if (workOrderId) filter.workOrderId = workOrderId;
    if (status) filter.status = status;

    const jobWorks = await JobWork.find(filter)
      .populate('workOrderId', 'workOrderId')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: jobWorks.length,
      data: jobWorks
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Receive job work
// @route   PUT /api/jobwork/:id/receive
// @access  Private
export const receiveJobWork = async (req, res, next) => {
  try {
    const { receivedQuantity } = req.body;

    const jobWork = await JobWork.findById(req.params.id);

    if (!jobWork) {
      return res.status(404).json({
        success: false,
        message: 'Job work not found'
      });
    }

    const newReceivedQuantity = (jobWork.quantityReceived || 0) + receivedQuantity;

    if (newReceivedQuantity > jobWork.quantitySent) {
      return res.status(400).json({
        success: false,
        message: 'Received quantity cannot exceed sent quantity'
      });
    }

    jobWork.quantityReceived = newReceivedQuantity;

    // Update status based on received quantity
    // Status flow: Sent -> In Process -> Returned
    if (newReceivedQuantity >= jobWork.quantitySent) {
      jobWork.status = 'Returned';
    } else if (newReceivedQuantity > 0) {
      jobWork.status = 'In Process';
    } else {
      jobWork.status = 'Sent';
    }

    await jobWork.save();

    // If job work is returned, check if all production stages are completed
    if (jobWork.status === 'Returned') {
      const workOrder = await WorkOrder.findById(jobWork.workOrderId);
      if (workOrder && workOrder.orderId) {
        await checkProductionCompletion(workOrder.orderId, req.user._id);
      }
    }

    // Log audit
    await logAudit(req.user._id, 'Update', 'JobWork', jobWork._id, {
      receivedQuantity: newReceivedQuantity,
      status: jobWork.status
    });

    res.status(200).json({
      success: true,
      message: 'Job work received successfully',
      data: jobWork
    });
  } catch (error) {
    next(error);
  }
};
