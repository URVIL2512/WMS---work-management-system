import JobCard from '../models/JobCard.model.js';
import WorkOrder from '../models/WorkOrder.model.js';
import { generateJobCardId } from '../utils/generateId.js';
import { logAudit } from '../utils/auditLogger.js';
import { checkProductionCompletion } from '../utils/orderAutomation.js';

// @desc    Create job card
// @route   POST /api/jobcards
// @access  Private
export const createJobCard = async (req, res, next) => {
  try {
    const {
      workOrderId,
      processName,
      productName,
      quantity,
      department
    } = req.body;

    const jobCard = await JobCard.create({
      jobCardId: generateJobCardId(),
      workOrderId,
      processName,
      productName,
      quantity,
      department,
      status: 'Pending'
    });

    // Log audit
    await logAudit(req.user._id, 'Create', 'JobCard', jobCard._id);

    res.status(201).json({
      success: true,
      message: 'Job card created successfully',
      data: jobCard
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all job cards
// @route   GET /api/jobcards
// @access  Private
export const getJobCards = async (req, res, next) => {
  try {
    const { workOrderId, status } = req.query;
    const filter = {};
    if (workOrderId) filter.workOrderId = workOrderId;
    if (status) filter.status = status;

    const jobCards = await JobCard.find(filter)
      .populate('workOrderId', 'workOrderId')
      .populate('completedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: jobCards.length,
      data: jobCards
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update job card status
// @route   PUT /api/jobcards/:id/status
// @access  Private
export const updateJobCardStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['Pending', 'In Progress', 'Completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const jobCard = await JobCard.findById(req.params.id);

    if (!jobCard) {
      return res.status(404).json({
        success: false,
        message: 'Job card not found'
      });
    }

    jobCard.status = status;
    if (status === 'Completed') {
      jobCard.completedBy = req.user._id;
      jobCard.completedAt = new Date();
    }

    await jobCard.save();

    // Log audit
    await logAudit(req.user._id, 'Status Change', 'JobCard', jobCard._id, { status });

    // If job card is completed, check if all production stages are completed
    if (status === 'Completed') {
      const workOrder = await WorkOrder.findById(jobCard.workOrderId);
      if (workOrder && workOrder.orderId) {
        await checkProductionCompletion(workOrder.orderId, req.user._id);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Job card status updated successfully',
      data: jobCard
    });
  } catch (error) {
    next(error);
  }
};
