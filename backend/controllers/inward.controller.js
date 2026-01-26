import JobWork from '../models/JobWork.model.js';
import { logAudit } from '../utils/auditLogger.js';

// @desc    Create inward (job work return)
// @route   POST /api/inward
// @access  Private
export const createInward = async (req, res, next) => {
  try {
    const { jobWorkId, receivedQuantity } = req.body;

    const jobWork = await JobWork.findById(jobWorkId);

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
    if (newReceivedQuantity >= jobWork.quantitySent) {
      jobWork.status = 'Completed';
    } else if (newReceivedQuantity > 0) {
      jobWork.status = 'Partial Received';
    }

    await jobWork.save();

    // Log audit
    await logAudit(req.user._id, 'Create', 'Inward', jobWork._id, {
      receivedQuantity: newReceivedQuantity,
      status: jobWork.status
    });

    res.status(201).json({
      success: true,
      message: 'Inward processed successfully',
      data: {
        jobWorkId: jobWork._id,
        quantityReceived: newReceivedQuantity,
        status: jobWork.status,
        receivedBy: req.user._id,
        receivedAt: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};
