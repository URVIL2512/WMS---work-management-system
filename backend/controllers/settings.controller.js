import Settings from '../models/Settings.model.js';
import { logAudit } from '../utils/auditLogger.js';
import { clearSettingsCache } from '../utils/settingsCache.js';

// @desc    Get settings
// @route   GET /api/settings
// @access  Private
export const getSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getSettings();

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update settings
// @route   PUT /api/settings
// @access  Private
export const updateSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create(req.body);
    } else {
      settings = await Settings.findOneAndUpdate(
        { _id: settings._id },
        req.body,
        { new: true, runValidators: true }
      );
    }

    // Clear cache after update
    clearSettingsCache();

    // Log audit
    await logAudit(req.user._id, 'Update', 'Settings', settings._id, {
      action: 'Company Settings Updated'
    });

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    next(error);
  }
};
