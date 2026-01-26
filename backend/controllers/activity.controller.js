import AuditLog from '../models/AuditLog.model.js';

// @desc    Get user's recent activities
// @route   GET /api/activities
// @access  Private
export const getUserActivities = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 5;

    const activities = await AuditLog.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('userId', 'name email')
      .lean();

    // Format activities for frontend
    const formattedActivities = activities.map(activity => ({
      id: activity._id,
      action: activity.action,
      module: activity.module,
      details: activity.details,
      timestamp: activity.timestamp,
      user: {
        name: activity.userId?.name || 'Unknown',
        email: activity.userId?.email || ''
      }
    }));

    res.status(200).json({
      success: true,
      data: formattedActivities
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all activities (Admin only)
// @route   GET /api/activities/all
// @access  Private/Admin
export const getAllActivities = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    const activities = await AuditLog.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('userId', 'name email')
      .lean();

    const formattedActivities = activities.map(activity => ({
      id: activity._id,
      action: activity.action,
      module: activity.module,
      details: activity.details,
      timestamp: activity.timestamp,
      user: {
        name: activity.userId?.name || 'Unknown',
        email: activity.userId?.email || ''
      }
    }));

    res.status(200).json({
      success: true,
      data: formattedActivities
    });
  } catch (error) {
    next(error);
  }
};
