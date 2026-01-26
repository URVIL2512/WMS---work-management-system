import Order from '../models/Order.model.js';
import WorkOrder from '../models/WorkOrder.model.js';
import JobWork from '../models/JobWork.model.js';
import Dispatch from '../models/Dispatch.model.js';

// @desc    Get orders report
// @route   GET /api/reports/orders
// @access  Private
export const getOrdersReport = async (req, res, next) => {
  try {
    const { startDate, endDate, status } = req.query;
    const filter = {};

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    // Aggregate data
    const totalOrders = orders.length;
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        statusCounts,
        orders
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get production report
// @route   GET /api/reports/production
// @access  Private
export const getProductionReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const workOrders = await WorkOrder.find(filter)
      .populate('orderId', 'orderId soNumber customerName')
      .sort({ createdAt: -1 });

    const jobCards = await WorkOrder.aggregate([
      { $match: filter },
      { $lookup: { from: 'jobcards', localField: '_id', foreignField: 'workOrderId', as: 'jobCards' } },
      { $unwind: { path: '$jobCards', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$jobCards.status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalWorkOrders: workOrders.length,
        workOrders,
        jobCardStatusCounts: jobCards
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get vendor report
// @route   GET /api/reports/vendor
// @access  Private
export const getVendorReport = async (req, res, next) => {
  try {
    const { vendorName, startDate, endDate } = req.query;
    const filter = {};

    if (vendorName) filter.vendorName = new RegExp(vendorName, 'i');
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const jobWorks = await JobWork.find(filter)
      .populate('workOrderId', 'workOrderId')
      .sort({ createdAt: -1 });

    // Aggregate by vendor
    const vendorStats = jobWorks.reduce((acc, jw) => {
      if (!acc[jw.vendorName]) {
        acc[jw.vendorName] = {
          vendorName: jw.vendorName,
          totalSent: 0,
          totalReceived: 0,
          pending: 0,
          completed: 0
        };
      }
      acc[jw.vendorName].totalSent += jw.quantitySent;
      acc[jw.vendorName].totalReceived += jw.quantityReceived;
      if (jw.status === 'Completed') {
        acc[jw.vendorName].completed += 1;
      } else {
        acc[jw.vendorName].pending += 1;
      }
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        jobWorks,
        vendorStats: Object.values(vendorStats)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dispatch report
// @route   GET /api/reports/dispatch
// @access  Private
export const getDispatchReport = async (req, res, next) => {
  try {
    const { startDate, endDate, transportName } = req.query;
    const filter = {};

    if (transportName) filter.transportName = new RegExp(transportName, 'i');
    if (startDate || endDate) {
      filter.dispatchDate = {};
      if (startDate) filter.dispatchDate.$gte = new Date(startDate);
      if (endDate) filter.dispatchDate.$lte = new Date(endDate);
    }

    const dispatches = await Dispatch.find(filter)
      .populate('orderId', 'orderId soNumber customerName itemName')
      .populate('dispatchedBy', 'name')
      .sort({ dispatchDate: -1 });

    // Aggregate by transport
    const transportStats = dispatches.reduce((acc, dispatch) => {
      if (!acc[dispatch.transportName]) {
        acc[dispatch.transportName] = {
          transportName: dispatch.transportName,
          count: 0
        };
      }
      acc[dispatch.transportName].count += 1;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        totalDispatches: dispatches.length,
        dispatches,
        transportStats: Object.values(transportStats)
      }
    });
  } catch (error) {
    next(error);
  }
};
