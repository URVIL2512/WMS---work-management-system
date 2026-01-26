import Order from '../models/Order.model.js';
import WorkOrder from '../models/WorkOrder.model.js';
import JobCard from '../models/JobCard.model.js';
import JobWork from '../models/JobWork.model.js';
import Inspection from '../models/Inspection.model.js';
import { ORDER_STATUSES } from './orderStatusTransitions.js';
import { logAudit } from './auditLogger.js';

/**
 * Auto-update order status when work order is created
 * Confirmed -> In Production
 */
export const handleWorkOrderCreated = async (orderId, userId) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) return;

    if (order.status === ORDER_STATUSES.CONFIRMED) {
      order.status = ORDER_STATUSES.IN_PRODUCTION;
      order.statusHistory.push({
        status: ORDER_STATUSES.IN_PRODUCTION,
        changedBy: userId,
        changedAt: new Date(),
        reason: 'Work Order Created'
      });
      await order.save();

      await logAudit(userId, 'Status Change', 'Order', order._id, {
        action: 'Auto Status Update',
        oldStatus: ORDER_STATUSES.CONFIRMED,
        newStatus: ORDER_STATUSES.IN_PRODUCTION,
        reason: 'Work Order Created'
      });
    }
  } catch (error) {
    console.error('Error in handleWorkOrderCreated:', error);
  }
};

/**
 * Check if all production stages are completed
 * Auto-update: In Production -> Ready For Dispatch
 * 
 * Production completion requires:
 * 1. ALL Inhouse Job Cards = Completed
 * 2. ALL Outside Job Work = Returned
 * 3. Quality Inspection = Passed
 */
export const checkProductionCompletion = async (orderId, userId) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) return;

    // Only check if order is in production
    if (order.status !== ORDER_STATUSES.IN_PRODUCTION) return;

    // Get all work orders for this order
    const workOrders = await WorkOrder.find({ orderId: order._id });
    if (workOrders.length === 0) return;

    const workOrderIds = workOrders.map(wo => wo._id);

    // 1. Check ALL Inhouse Job Cards are Completed
    const jobCards = await JobCard.find({ workOrderId: { $in: workOrderIds } });
    const allJobCardsCompleted = jobCards.length > 0 && jobCards.every(jc => jc.status === 'Completed');

    // 2. Check ALL Outside Job Work are Returned
    const jobWorks = await JobWork.find({ workOrderId: { $in: workOrderIds } });
    const allJobWorksReturned = jobWorks.length === 0 || jobWorks.every(jw => jw.status === 'Returned');

    // 3. Check Quality Inspection is Passed
    const inspection = await Inspection.findOne({ orderId: order._id });
    const inspectionPassed = inspection && inspection.result === 'Pass';

    // Production is complete only if ALL conditions are met
    const productionComplete = allJobCardsCompleted && allJobWorksReturned && inspectionPassed;

    if (productionComplete) {
      order.status = ORDER_STATUSES.READY_FOR_DISPATCH;
      order.statusHistory.push({
        status: ORDER_STATUSES.READY_FOR_DISPATCH,
        changedBy: userId,
        changedAt: new Date(),
        reason: 'Production Completed: All Job Cards Completed, All Job Work Returned, Inspection Passed'
      });
      await order.save();

      await logAudit(userId, 'Status Change', 'Order', order._id, {
        action: 'Auto Status Update',
        oldStatus: ORDER_STATUSES.IN_PRODUCTION,
        newStatus: ORDER_STATUSES.READY_FOR_DISPATCH,
        reason: 'Production Completed'
      });
    }
  } catch (error) {
    console.error('Error in checkProductionCompletion:', error);
  }
};

/**
 * Legacy function - kept for backward compatibility
 * @deprecated Use checkProductionCompletion instead
 */
export const checkJobCardsCompletion = async (orderId, userId) => {
  return checkProductionCompletion(orderId, userId);
};

/**
 * Auto-update order status when dispatch is created
 * Ready For Dispatch -> Dispatched
 */
export const handleDispatchCreated = async (orderId, userId, dispatchInfo) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) return;

    if (order.status === ORDER_STATUSES.READY_FOR_DISPATCH) {
      order.status = ORDER_STATUSES.DISPATCHED;
      order.dispatchInfo = {
        vehicleNumber: dispatchInfo.vehicleNumber,
        lrNumber: dispatchInfo.lrNumber,
        driverName: dispatchInfo.driverName,
        dispatchDate: dispatchInfo.dispatchDate ? new Date(dispatchInfo.dispatchDate) : new Date()
      };
      order.statusHistory.push({
        status: ORDER_STATUSES.DISPATCHED,
        changedBy: userId,
        changedAt: new Date(),
        reason: 'Dispatch Created'
      });
      await order.save();

      await logAudit(userId, 'Status Change', 'Order', order._id, {
        action: 'Auto Status Update',
        oldStatus: ORDER_STATUSES.READY_FOR_DISPATCH,
        newStatus: ORDER_STATUSES.DISPATCHED,
        reason: 'Dispatch Created'
      });
    }
  } catch (error) {
    console.error('Error in handleDispatchCreated:', error);
  }
};

/**
 * Auto-update order status when invoice is paid
 * Delivered -> Closed (if all conditions met)
 */
export const handleInvoicePaid = async (orderId, userId) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) return;

    if (order.status === ORDER_STATUSES.DELIVERED && 
        order.invoiceGenerated && 
        order.paymentStatus === 'Completed') {
      order.status = ORDER_STATUSES.CLOSED;
      order.statusHistory.push({
        status: ORDER_STATUSES.CLOSED,
        changedBy: userId,
        changedAt: new Date(),
        reason: 'Invoice Paid and Delivered'
      });
      await order.save();

      await logAudit(userId, 'Status Change', 'Order', order._id, {
        action: 'Auto Status Update',
        oldStatus: ORDER_STATUSES.DELIVERED,
        newStatus: ORDER_STATUSES.CLOSED,
        reason: 'Invoice Paid and Delivered'
      });
    }
  } catch (error) {
    console.error('Error in handleInvoicePaid:', error);
  }
};
