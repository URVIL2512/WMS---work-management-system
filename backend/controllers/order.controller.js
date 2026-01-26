import Order from '../models/Order.model.js';
import Quotation from '../models/Quotation.model.js';
import WorkOrder from '../models/WorkOrder.model.js';
import JobCard from '../models/JobCard.model.js';
import { generateOrderId, generateSONumber } from '../utils/generateId.js';
import { logAudit } from '../utils/auditLogger.js';
import {
  validateStatusTransition,
  canEditOrder,
  isOrderLocked,
  canCancelOrder,
  canPutOnHold,
  getRequiredFieldsForStatus,
  ORDER_STATUSES
} from '../utils/orderStatusTransitions.js';

// @desc    Create order (with or without quotation)
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res, next) => {
  try {
    const { 
      quotationId, 
      soNumber: providedSoNumber,
      customerId,
      customerName,
      contactNumber,
      email,
      items, // New structure: items[] with processes[]
      // Legacy fields for backward compatibility
      itemName,
      itemDescription,
      quantity,
      processes,
      gstPercent,
      packagingCost,
      transportCost,
      totalAmount,
      paymentTerms,
      deliveryDate, 
      deliveryAddress, 
      expectedDispatchDate, 
      remarks 
    } = req.body;

    let quotation = null;
    let orderData = {};

    // If quotationId is provided, validate and use quotation data
    if (quotationId) {
      quotation = await Quotation.findById(quotationId);
      
      if (!quotation) {
        return res.status(404).json({
          success: false,
          message: 'Quotation not found'
        });
      }

      if (quotation.status !== 'Approved') {
        return res.status(400).json({
          success: false,
          message: `Quotation must be Approved to create an order. Current status: ${quotation.status}`
        });
      }

      // Check if quotation has expired
      if (quotation.validUntil && new Date(quotation.validUntil) < new Date()) {
        return res.status(400).json({
          success: false,
          message: `Cannot create order from expired quotation. Valid until: ${new Date(quotation.validUntil).toLocaleDateString()}`
        });
      }

      // Use quotation data
      orderData = {
        quotationId: quotation._id,
        quotationNumber: quotation.quotationNumber,
        customerName: quotation.partyName,
        contactNumber: quotation.contactNumber,
        email: quotation.email,
        itemName: quotation.itemDescription || quotation.processes?.[0]?.processName || 'Item',
        itemDescription: quotation.itemDescription,
        quantity: quantity || 1,
        processes: quotation.processes || [],
        gstPercent: quotation.gstPercent || 0,
        packagingCost: quotation.packagingCost || 0,
        transportCost: quotation.transportCost || 0,
        totalAmount: quotation.totalAmount,
        paymentTerms: quotation.paymentTerms
      };
    } else {
      // Manual order creation - NEW STRUCTURE with items[] and processes[]
      if (items && Array.isArray(items) && items.length > 0) {
        // New structure: items with processes
        if (!customerName || !customerName.trim()) {
          return res.status(400).json({
            success: false,
            message: 'Customer Name is required'
          });
        }

        // Validate items structure
        if (items.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'At least one item is required'
          });
        }

        // Validate each item
        for (const item of items) {
          if (!item.itemId && !item.itemName) {
            return res.status(400).json({
              success: false,
              message: 'Each item must have itemId or itemName'
            });
          }

          if (!item.quantity || item.quantity < 1) {
            return res.status(400).json({
              success: false,
              message: 'Each item must have quantity >= 1'
            });
          }

          if (!item.processes || !Array.isArray(item.processes) || item.processes.length === 0) {
            return res.status(400).json({
              success: false,
              message: `Item "${item.itemName || 'Unknown'}" must have at least one process`
            });
          }

          // Validate processes for this item
          for (const process of item.processes) {
            // Clean up empty processId (prevent ObjectId cast error)
            if (process.processId === '' || process.processId === null || process.processId === undefined) {
              delete process.processId;
            }

            if (!process.processName || process.processName.trim() === '') {
              return res.status(400).json({
                success: false,
                message: 'All processes must have a process name'
              });
            }

            if (process.rate === undefined || process.rate < 0) {
              return res.status(400).json({
                success: false,
                message: 'All processes must have a rate >= 0'
              });
            }

            if (!process.quantity || process.quantity < 1) {
              return res.status(400).json({
                success: false,
                message: 'All processes must have quantity >= 1'
              });
            }

            // Calculate process amount if not provided
            if (process.amount === undefined) {
              process.amount = (process.rate || 0) * (process.quantity || 1);
            }
          }

          // Calculate item total if not provided
          if (item.itemTotal === undefined) {
            item.itemTotal = item.processes.reduce((sum, p) => sum + (p.amount || 0), 0);
          }
        }

        // Calculate order total from items
        const itemsTotal = items.reduce((sum, item) => sum + (item.itemTotal || 0), 0);
        const gstAmount = itemsTotal * ((gstPercent || 0) / 100);
        const calculatedTotal = itemsTotal + gstAmount + (packagingCost || 0) + (transportCost || 0);

        // Fetch customer details if customerId provided
        let customerDetails = {};
        if (customerId) {
          try {
            const Customer = (await import('../models/Customer.model.js')).default;
            const customer = await Customer.findById(customerId);
            if (customer) {
              customerDetails = {
                customerId: customer._id,
                customerName: customer.customerName || customer.name,
                contactNumber: customer.mobile || customer.contactNumber || '',
                email: customer.email || ''
              };
            }
          } catch (err) {
            console.error('Error fetching customer:', err);
          }
        }

        orderData = {
          quotationId: null,
          quotationNumber: null,
          customerId: customerId || null,
          customerName: customerDetails.customerName || customerName.trim(),
          contactNumber: customerDetails.contactNumber || contactNumber?.trim() || '',
          email: customerDetails.email || email?.trim() || '',
          items: items,
          // Legacy fields for backward compatibility (use first item)
          itemName: items[0]?.itemName || '',
          itemDescription: items[0]?.itemDescription || '',
          quantity: items.reduce((sum, item) => sum + item.quantity, 0),
          processes: items.flatMap(item => item.processes.map(p => ({
            processName: p.processName,
            rate: p.rate
          }))),
          gstPercent: gstPercent || 0,
          packagingCost: packagingCost || 0,
          transportCost: transportCost || 0,
          totalAmount: totalAmount || calculatedTotal,
          paymentTerms: paymentTerms?.trim() || ''
        };
      } else {
        // Legacy structure: single item with processes array
        if (!customerName || !customerName.trim()) {
          return res.status(400).json({
            success: false,
            message: 'Customer Name is required'
          });
        }

        if (!itemName || !itemName.trim()) {
          return res.status(400).json({
            success: false,
            message: 'Item Name is required'
          });
        }

        if (!quantity || quantity < 1) {
          return res.status(400).json({
            success: false,
            message: 'Quantity must be at least 1'
          });
        }

        if (!processes || !Array.isArray(processes) || processes.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'At least one process/item is required'
          });
        }

        // Validate processes
        const invalidProcess = processes.find(p => !p.processName || !p.rate || p.rate <= 0);
        if (invalidProcess) {
          return res.status(400).json({
            success: false,
            message: 'All processes must have a name and a rate greater than 0'
          });
        }

        // Calculate total amount if not provided
        let calculatedTotal = totalAmount;
        if (!calculatedTotal) {
          const processTotal = processes.reduce((sum, p) => sum + (p.rate * (p.quantity || 1)), 0);
          const gstAmount = processTotal * ((gstPercent || 0) / 100);
          calculatedTotal = processTotal + gstAmount + (packagingCost || 0) + (transportCost || 0);
        }

        orderData = {
          quotationId: null,
          quotationNumber: null,
          customerId: customerId || null,
          customerName: customerName.trim(),
          contactNumber: contactNumber?.trim() || '',
          email: email?.trim() || '',
          itemName: itemName.trim(),
          itemDescription: itemDescription?.trim() || '',
          quantity: quantity,
          processes: processes,
          gstPercent: gstPercent || 0,
          packagingCost: packagingCost || 0,
          transportCost: transportCost || 0,
          totalAmount: calculatedTotal,
          paymentTerms: paymentTerms?.trim() || ''
        };
      }
    }

    // Generate order ID and SO number
    const orderId = generateOrderId();
    const soNumber = providedSoNumber && providedSoNumber.trim() !== '' 
      ? providedSoNumber.trim() 
      : await generateSONumber();

    // Create order
    const order = await Order.create({
      orderId,
      soNumber,
      ...orderData,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
      deliveryAddress: deliveryAddress?.trim() || '',
      expectedDispatchDate: expectedDispatchDate ? new Date(expectedDispatchDate) : undefined,
      remarks: remarks?.trim() || '',
      orderDate: new Date(),
      status: 'Open',
      createdBy: req.user._id
    });

    // If order was created from quotation, update quotation status to Converted
    if (quotation) {
      const validateStatusTransition = (currentStatus, newStatus) => {
        const ALLOWED_TRANSITIONS = {
          'Draft': ['Sent', 'Rejected'],
          'Sent': ['Approved', 'Request Changes', 'Rejected'],
          'Request Changes': ['Draft', 'Sent'],
          'Approved': ['Converted'],
          'Rejected': ['Draft'],
          'Converted': [],
          'Expired': ['Draft']
        };
        
        if (!ALLOWED_TRANSITIONS[currentStatus]) {
          return { allowed: false, message: `Invalid current status: ${currentStatus}` };
        }
        
        const allowedTransitions = ALLOWED_TRANSITIONS[currentStatus];
        if (!allowedTransitions.includes(newStatus)) {
          return {
            allowed: false,
            message: `Cannot transition from "${currentStatus}" to "${newStatus}". Allowed transitions: ${allowedTransitions.join(', ') || 'None'}`
          };
        }
        
        return { allowed: true, message: 'Transition allowed' };
      };
      
      const validation = validateStatusTransition(quotation.status, 'Converted');
      if (validation.allowed) {
        quotation.status = 'Converted';
        await quotation.save();

        await logAudit(req.user._id, 'Update', 'Quotation', quotation._id, {
          action: 'Converted to Order',
          quotationNumber: quotation.quotationNumber,
          orderId: order.orderId
        });
      }
    }

    // Log audit with details
    await logAudit(req.user._id, 'Create', 'Order', order._id, {
      orderId: order.orderId,
      soNumber: order.soNumber,
      quotationNumber: order.quotationNumber || 'N/A',
      customerName: order.customerName
    });

    res.status(201).json({
      success: true,
      message: quotation ? 'Order created successfully from approved quotation' : 'Order created successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm order (Open -> Confirmed)
// @route   PUT /api/orders/:id/confirm
// @access  Private
export const confirmOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Validate status transition
    const validation = validateStatusTransition(order.status, ORDER_STATUSES.CONFIRMED);
    if (!validation.allowed) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const oldStatus = order.status;
    order.status = ORDER_STATUSES.CONFIRMED;
    
    // Add to status history
    order.statusHistory.push({
      status: ORDER_STATUSES.CONFIRMED,
      changedBy: req.user._id,
      changedAt: new Date()
    });

    await order.save();

    // Log audit
    await logAudit(req.user._id, 'Status Change', 'Order', order._id, {
      action: 'Order Confirmed',
      oldStatus,
      newStatus: ORDER_STATUSES.CONFIRMED
    });

    res.status(200).json({
      success: true,
      message: 'Order confirmed successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Cancel reason is required'
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Validate status transition
    const validation = validateStatusTransition(order.status, ORDER_STATUSES.CANCELLED);
    if (!validation.allowed) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    // Check if work orders exist
    const workOrders = await WorkOrder.find({ orderId: order._id });
    if (workOrders.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel order. Work orders have been created. Production has started.'
      });
    }

    const oldStatus = order.status;
    order.status = ORDER_STATUSES.CANCELLED;
    order.cancelReason = reason.trim();
    order.isLocked = true;
    order.lockedAt = new Date();
    
    order.statusHistory.push({
      status: ORDER_STATUSES.CANCELLED,
      changedBy: req.user._id,
      changedAt: new Date(),
      reason: reason.trim()
    });

    await order.save();

    await logAudit(req.user._id, 'Status Change', 'Order', order._id, {
      action: 'Order Cancelled',
      oldStatus,
      newStatus: ORDER_STATUSES.CANCELLED,
      reason: reason.trim()
    });

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Put order on hold
// @route   PUT /api/orders/:id/hold
// @access  Private
export const putOrderOnHold = async (req, res, next) => {
  try {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Hold reason is required'
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Validate status transition
    const validation = validateStatusTransition(order.status, ORDER_STATUSES.ON_HOLD);
    if (!validation.allowed) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const oldStatus = order.status;
    order.status = ORDER_STATUSES.ON_HOLD;
    order.holdReason = reason.trim();
    
    order.statusHistory.push({
      status: ORDER_STATUSES.ON_HOLD,
      changedBy: req.user._id,
      changedAt: new Date(),
      reason: reason.trim()
    });

    await order.save();

    await logAudit(req.user._id, 'Status Change', 'Order', order._id, {
      action: 'Order Put On Hold',
      oldStatus,
      newStatus: ORDER_STATUSES.ON_HOLD,
      reason: reason.trim()
    });

    res.status(200).json({
      success: true,
      message: 'Order put on hold successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Dispatch order
// @route   PUT /api/orders/:id/dispatch
// @access  Private
export const dispatchOrder = async (req, res, next) => {
  try {
    const { dispatchInfo } = req.body;

    if (!dispatchInfo || !dispatchInfo.vehicleNumber || !dispatchInfo.lrNumber || !dispatchInfo.driverName) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle number, LR number, and driver name are required for dispatch'
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Validate status transition
    const validation = validateStatusTransition(order.status, ORDER_STATUSES.DISPATCHED);
    if (!validation.allowed) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const oldStatus = order.status;
    order.status = ORDER_STATUSES.DISPATCHED;
    order.dispatchInfo = {
      vehicleNumber: dispatchInfo.vehicleNumber,
      lrNumber: dispatchInfo.lrNumber,
      driverName: dispatchInfo.driverName,
      dispatchDate: dispatchInfo.dispatchDate ? new Date(dispatchInfo.dispatchDate) : new Date()
    };
    
    order.statusHistory.push({
      status: ORDER_STATUSES.DISPATCHED,
      changedBy: req.user._id,
      changedAt: new Date(),
      reason: 'Dispatch Created'
    });

    await order.save();

    await logAudit(req.user._id, 'Status Change', 'Order', order._id, {
      action: 'Order Dispatched',
      oldStatus,
      newStatus: ORDER_STATUSES.DISPATCHED,
      dispatchInfo: order.dispatchInfo
    });

    res.status(200).json({
      success: true,
      message: 'Order dispatched successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark order as delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private
export const markDelivered = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Validate status transition
    const validation = validateStatusTransition(order.status, ORDER_STATUSES.DELIVERED);
    if (!validation.allowed) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const oldStatus = order.status;
    order.status = ORDER_STATUSES.DELIVERED;
    order.deliveredAt = new Date();
    order.deliveredBy = req.user._id;
    
    order.statusHistory.push({
      status: ORDER_STATUSES.DELIVERED,
      changedBy: req.user._id,
      changedAt: new Date(),
      reason: 'Delivery Confirmed'
    });

    await order.save();

    await logAudit(req.user._id, 'Status Change', 'Order', order._id, {
      action: 'Order Delivered',
      oldStatus,
      newStatus: ORDER_STATUSES.DELIVERED
    });

    // Check if order can be auto-closed (Delivered + Invoice Generated + Payment Completed)
    await handleInvoicePaid(order._id, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Order marked as delivered successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Close order (manual close if all conditions met)
// @route   PUT /api/orders/:id/close
// @access  Private
export const closeOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Validate status transition
    const validation = validateStatusTransition(order.status, ORDER_STATUSES.CLOSED);
    if (!validation.allowed) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    // Check if all conditions are met
    if (order.status !== ORDER_STATUSES.DELIVERED) {
      return res.status(400).json({
        success: false,
        message: 'Order must be Delivered before closing'
      });
    }

    if (!order.invoiceGenerated) {
      return res.status(400).json({
        success: false,
        message: 'Invoice must be generated before closing order'
      });
    }

    if (order.paymentStatus !== 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment must be completed before closing order'
      });
    }

    const oldStatus = order.status;
    order.status = ORDER_STATUSES.CLOSED;
    order.isLocked = true;
    order.lockedAt = new Date();
    
    order.statusHistory.push({
      status: ORDER_STATUSES.CLOSED,
      changedBy: req.user._id,
      changedAt: new Date(),
      reason: 'Order Closed - All conditions met'
    });

    await order.save();

    await logAudit(req.user._id, 'Status Change', 'Order', order._id, {
      action: 'Order Closed',
      oldStatus,
      newStatus: ORDER_STATUSES.CLOSED
    });

    res.status(200).json({
      success: true,
      message: 'Order closed successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order statistics for dashboard
// @route   GET /api/orders/stats
// @access  Private
export const getOrderStats = async (req, res, next) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statsMap = {
      open: 0,
      inProduction: 0,
      readyForDispatch: 0,
      delayed: 0,
      completed: 0
    };

    stats.forEach(stat => {
      if (stat._id === ORDER_STATUSES.OPEN) statsMap.open = stat.count;
      if (stat._id === ORDER_STATUSES.IN_PRODUCTION) statsMap.inProduction = stat.count;
      if (stat._id === ORDER_STATUSES.READY_FOR_DISPATCH) statsMap.readyForDispatch = stat.count;
      if (stat._id === ORDER_STATUSES.DELIVERED || stat._id === ORDER_STATUSES.CLOSED) statsMap.completed += stat.count;
    });

    // Calculate delayed orders (past delivery date and not delivered/closed)
    const now = new Date();
    const delayedOrders = await Order.countDocuments({
      deliveryDate: { $lt: now },
      status: { $nin: [ORDER_STATUSES.DELIVERED, ORDER_STATUSES.CLOSED, ORDER_STATUSES.CANCELLED] }
    });
    statsMap.delayed = delayedOrders;

    res.status(200).json({
      success: true,
      data: statsMap
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
export const getOrders = async (req, res, next) => {
  try {
    const { status, startDate, endDate, search } = req.query;
    let filter = {};
    
    // Valid status enum values (must match model exactly)
    const validStatuses = ['Open', 'Confirmed', 'In Production', 'Ready For Dispatch', 'Dispatched', 'Delivered', 'Closed', 'On Hold', 'Cancelled'];
    
    // Status filter - MUST be applied first with EXACT match
    if (status && status !== 'all' && validStatuses.includes(status)) {
      filter.status = status; // Exact match, no regex, no case-insensitive
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
          filter.createdAt.$gte = start;
        }
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          // Set to end of day for inclusive end date
          end.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = end;
        }
      }
    }

    // Search filter (by SO number, Order ID, or Customer Name)
    // IMPORTANT: Combine search with status filter using $and
    if (search && search.trim()) {
      const searchCondition = {
        $or: [
          { soNumber: { $regex: search.trim(), $options: 'i' } },
          { orderId: { $regex: search.trim(), $options: 'i' } },
          { customerName: { $regex: search.trim(), $options: 'i' } }
        ]
      };

      // If we have status filter, combine with $and to ensure BOTH conditions
      if (filter.status) {
        const statusFilter = { status: filter.status };
        delete filter.status;
        filter.$and = [statusFilter, searchCondition];
      } else {
        // No status filter, just use $or for search
        filter.$or = searchCondition.$or;
      }
    }
    // If only status filter (no search), filter.status is already set correctly above

    // Validate filter before querying
    if (status && status !== 'all' && !validStatuses.includes(status)) {
      console.warn('⚠️ [ORDERS] Invalid status value:', status, 'Valid values:', validStatuses);
      return res.status(400).json({
        success: false,
        message: `Invalid status value: ${status}. Valid values are: ${validStatuses.join(', ')}`
      });
    }

    console.log('🔍 [ORDERS] Filter:', JSON.stringify(filter, null, 2));
    console.log('🔍 [ORDERS] Query params - status:', status, 'search:', search);
    console.log('🔍 [ORDERS] Filter status value:', filter.status, 'Filter $and:', filter.$and);

    const orders = await Order.find(filter)
      .populate('createdBy', 'name email')
      .populate('quotationId', 'quotationNumber partyName')
      .sort({ orderDate: -1, createdAt: -1 }); // Sort by orderDate DESC (newest first), fallback to createdAt

    console.log('✅ [ORDERS] Found', orders.length, 'orders');
    
    // Verify filter worked correctly
    if (status && status !== 'all') {
      const mismatchedStatuses = orders.filter(o => o.status !== status);
      if (mismatchedStatuses.length > 0) {
        console.error('❌ [ORDERS] FILTER MISMATCH! Expected status:', status);
        console.error('❌ [ORDERS] Found orders with wrong statuses:');
        mismatchedStatuses.forEach(o => {
          console.error(`  - ${o.soNumber} (${o.customerName}) - Status: "${o.status}" (Expected: "${status}")`);
        });
      }
      
      console.log('📊 [ORDERS] Status breakdown:');
      const statusCounts = {};
      orders.forEach(o => {
        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
        console.log(`  - ${o.soNumber} (${o.customerName}) - Status: "${o.status}"`);
      });
      console.log('📊 [ORDERS] Status counts:', statusCounts);
    }

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
export const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status with validation
// @route   PUT /api/orders/:id/status
// @access  Private
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, reason, dispatchInfo } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Validate status transition
    const validation = validateStatusTransition(order.status, status);
    if (!validation.allowed) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    // Check required fields for status change
    const requiredFields = getRequiredFieldsForStatus(status);
    if (requiredFields.length > 0) {
      for (const field of requiredFields) {
        if (field === 'holdReason' && !reason) {
          return res.status(400).json({
            success: false,
            message: 'Hold reason is required when putting order on hold'
          });
        }
        if (field === 'cancelReason' && !reason) {
          return res.status(400).json({
            success: false,
            message: 'Cancel reason is required when cancelling order'
          });
        }
        if (field.startsWith('dispatchInfo.')) {
          const dispatchField = field.split('.')[1];
          if (!dispatchInfo || !dispatchInfo[dispatchField]) {
            return res.status(400).json({
              success: false,
              message: `${dispatchField} is required for dispatch`
            });
          }
        }
      }
    }

    // Store old status
    const oldStatus = order.status;

    // Update status
    order.status = status;

    // Update status-specific fields
    if (status === ORDER_STATUSES.ON_HOLD) {
      order.holdReason = reason;
    } else if (status === ORDER_STATUSES.CANCELLED) {
      order.cancelReason = reason;
    } else if (status === ORDER_STATUSES.DISPATCHED && dispatchInfo) {
      order.dispatchInfo = {
        vehicleNumber: dispatchInfo.vehicleNumber,
        lrNumber: dispatchInfo.lrNumber,
        driverName: dispatchInfo.driverName,
        dispatchDate: dispatchInfo.dispatchDate ? new Date(dispatchInfo.dispatchDate) : new Date()
      };
    } else if (status === ORDER_STATUSES.DELIVERED) {
      order.deliveredAt = new Date();
      order.deliveredBy = req.user._id;
    } else if (status === ORDER_STATUSES.CLOSED) {
      // Closed status - verify all conditions are met
      if (!order.invoiceGenerated) {
        return res.status(400).json({
          success: false,
          message: 'Cannot close order. Invoice must be generated first.'
        });
      }
      if (order.paymentStatus !== 'Completed') {
        return res.status(400).json({
          success: false,
          message: 'Cannot close order. Payment status must be Completed.'
        });
      }
    }

    // Lock order if status requires it
    if (isOrderLocked(status)) {
      order.isLocked = true;
      order.lockedAt = new Date();
    }

    // Add to status history
    order.statusHistory.push({
      status: status,
      changedBy: req.user._id,
      changedAt: new Date(),
      reason: reason || undefined
    });

    await order.save();

    // Log audit
    await logAudit(req.user._id, 'Status Change', 'Order', order._id, {
      oldStatus,
      newStatus: status,
      reason: reason || undefined
    });

    res.status(200).json({
      success: true,
      message: `Order status updated from ${oldStatus} to ${status}`,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private
export const updateOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order can be edited
    if (!canEditOrder(order.status)) {
      return res.status(403).json({
        success: false,
        message: `Cannot edit order. Current status: ${order.status}. Editing only allowed for Open or Confirmed orders.`
      });
    }

    // Prevent editing locked fields after Confirmed
    if (order.status === ORDER_STATUSES.CONFIRMED) {
      const lockedFields = ['quantity', 'processes', 'gstPercent', 'packagingCost', 'transportCost', 'totalAmount', 'customerName', 'deliveryDate'];
      const updateKeys = Object.keys(req.body);
      const restrictedFields = updateKeys.filter(key => lockedFields.includes(key));
      
      if (restrictedFields.length > 0) {
        return res.status(403).json({
          success: false,
          message: `Cannot edit locked fields after confirmation: ${restrictedFields.join(', ')}`
        });
      }
    }

    // Update only allowed fields
    const allowedFields = ['deliveryAddress', 'expectedDispatchDate', 'remarks'];
    const updateData = {};
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    Object.assign(order, updateData);
    await order.save();

    const updatedOrder = await Order.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('quotationId', 'quotationNumber partyName');

    // Log audit
    await logAudit(req.user._id, 'Update', 'Order', order._id, {
      updatedFields: Object.keys(updateData)
    });

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      data: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private
export const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if work orders exist
    const workOrders = await WorkOrder.find({ orderId: order._id });
    if (workOrders.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete order. Work orders exist for this order.'
      });
    }

    await Order.findByIdAndDelete(req.params.id);

    // Log audit
    await logAudit(req.user._id, 'Delete', 'Order', order._id, {
      orderId: order.orderId,
      customerName: order.customerName
    });

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
