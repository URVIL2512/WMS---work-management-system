import CompletedJob from '../models/CompletedJob.model.js';
import Order from '../models/Order.model.js';
import { logAudit } from '../utils/auditLogger.js';

// @desc    Get all completed jobs
// @route   GET /api/completed-jobs
// @access  Private
export const getCompletedJobs = async (req, res, next) => {
  try {
    const completedJobs = await CompletedJob.find()
      .populate('orderId', 'orderId soNumber customerName itemName quantity status')
      .sort({ completedDate: -1 });

    res.status(200).json({
      success: true,
      count: completedJobs.length,
      data: completedJobs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark job as ready for dispatch
// @route   PUT /api/completed-jobs/:id/ready
// @access  Private
export const markReadyForDispatch = async (req, res, next) => {
  try {
    const completedJob = await CompletedJob.findById(req.params.id)
      .populate('orderId');

    if (!completedJob) {
      return res.status(404).json({
        success: false,
        message: 'Completed job not found'
      });
    }

    completedJob.status = 'Ready For Dispatch';
    await completedJob.save();

    // Log audit
    await logAudit(req.user._id, 'Status Change', 'CompletedJob', completedJob._id, {
      status: 'Ready For Dispatch'
    });

    res.status(200).json({
      success: true,
      message: 'Job marked as ready for dispatch',
      data: completedJob
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single completed job
// @route   GET /api/completed-jobs/:id
// @access  Private
export const getCompletedJob = async (req, res, next) => {
  try {
    const completedJob = await CompletedJob.findById(req.params.id)
      .populate('orderId', 'orderId soNumber customerName itemName quantity status');

    if (!completedJob) {
      return res.status(404).json({
        success: false,
        message: 'Completed job not found'
      });
    }

    res.status(200).json({
      success: true,
      data: completedJob
    });
  } catch (error) {
    next(error);
  }
};
