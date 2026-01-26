import Master from '../models/Master.model.js';
import { logAudit } from '../utils/auditLogger.js';

// @desc    Create master entry
// @route   POST /api/masters/:type
// @access  Private
export const createMaster = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { name, additionalFields } = req.body;

    if (!['Customer', 'Vendor', 'Process', 'Transport', 'Item'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid master type. Must be Customer, Vendor, Process, Transport, or Item'
      });
    }

    const master = await Master.create({
      type,
      name,
      additionalFields: additionalFields || {},
      isActive: true
    });

    // Log audit with details
    await logAudit(req.user._id, 'Create', `Master-${type}`, master._id, {
      name: master.name,
      type: type
    });

    res.status(201).json({
      success: true,
      message: `${type} created successfully`,
      data: master
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: `${req.params.type} with this name already exists`
      });
    }
    next(error);
  }
};

// @desc    Get all masters by type
// @route   GET /api/masters/:type
// @access  Private
export const getMasters = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { isActive } = req.query;

    if (!['Customer', 'Vendor', 'Process', 'Transport', 'Item'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid master type'
      });
    }

    const filter = { type };
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const masters = await Master.find(filter).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: masters.length,
      data: masters
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update master
// @route   PUT /api/masters/:type/:id
// @access  Private
export const updateMaster = async (req, res, next) => {
  try {
    const { type, id } = req.params;

    const master = await Master.findOne({ _id: id, type });

    if (!master) {
      return res.status(404).json({
        success: false,
        message: `${type} not found`
      });
    }

    const updatedMaster = await Master.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    // Log audit with details
    await logAudit(req.user._id, 'Update', `Master-${type}`, updatedMaster._id, {
      name: updatedMaster.name,
      type: type
    });

    res.status(200).json({
      success: true,
      message: `${type} updated successfully`,
      data: updatedMaster
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete master
// @route   DELETE /api/masters/:type/:id
// @access  Private
export const deleteMaster = async (req, res, next) => {
  try {
    const { type, id } = req.params;

    const master = await Master.findOne({ _id: id, type });

    if (!master) {
      return res.status(404).json({
        success: false,
        message: `${type} not found`
      });
    }

    const masterName = master.name;
    await Master.findByIdAndDelete(id);

    // Log audit with details
    await logAudit(req.user._id, 'Delete', `Master-${type}`, id, {
      name: masterName,
      type: type
    });

    res.status(200).json({
      success: true,
      message: `${type} deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};
