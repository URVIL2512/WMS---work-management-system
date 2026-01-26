/**
 * Order Status Transition Validation Utility
 * Defines allowed status transitions for Sales Order lifecycle
 */

export const ORDER_STATUSES = {
  OPEN: 'Open',
  CONFIRMED: 'Confirmed',
  IN_PRODUCTION: 'In Production',
  READY_FOR_DISPATCH: 'Ready For Dispatch',
  DISPATCHED: 'Dispatched',
  DELIVERED: 'Delivered',
  CLOSED: 'Closed',
  ON_HOLD: 'On Hold',
  CANCELLED: 'Cancelled'
};

/**
 * Allowed status transitions
 */
export const ALLOWED_TRANSITIONS = {
  [ORDER_STATUSES.OPEN]: [
    ORDER_STATUSES.CONFIRMED,
    ORDER_STATUSES.ON_HOLD,
    ORDER_STATUSES.CANCELLED
  ],
  [ORDER_STATUSES.CONFIRMED]: [
    ORDER_STATUSES.IN_PRODUCTION,
    ORDER_STATUSES.ON_HOLD,
    ORDER_STATUSES.CANCELLED
  ],
  [ORDER_STATUSES.IN_PRODUCTION]: [
    ORDER_STATUSES.READY_FOR_DISPATCH,
    ORDER_STATUSES.ON_HOLD
  ],
  [ORDER_STATUSES.READY_FOR_DISPATCH]: [
    ORDER_STATUSES.DISPATCHED
  ],
  [ORDER_STATUSES.DISPATCHED]: [
    ORDER_STATUSES.DELIVERED
  ],
  [ORDER_STATUSES.DELIVERED]: [
    ORDER_STATUSES.CLOSED
  ],
  [ORDER_STATUSES.ON_HOLD]: [
    ORDER_STATUSES.OPEN,
    ORDER_STATUSES.CONFIRMED,
    ORDER_STATUSES.IN_PRODUCTION
  ],
  [ORDER_STATUSES.CANCELLED]: [], // No transitions from cancelled
  [ORDER_STATUSES.CLOSED]: [] // No transitions from closed
};

/**
 * Validate if a status transition is allowed
 * @param {string} currentStatus - Current order status
 * @param {string} newStatus - Desired new status
 * @returns {Object} { allowed: boolean, message: string }
 */
export const validateStatusTransition = (currentStatus, newStatus) => {
  if (!currentStatus) {
    return { allowed: false, message: 'Current status is required' };
  }

  if (!newStatus) {
    return { allowed: false, message: 'New status is required' };
  }

  if (currentStatus === newStatus) {
    return { allowed: false, message: 'Status is already set to this value' };
  }

  const allowedTransitions = ALLOWED_TRANSITIONS[currentStatus];

  if (!allowedTransitions) {
    return { allowed: false, message: `Invalid current status: ${currentStatus}` };
  }

  if (!allowedTransitions.includes(newStatus)) {
    return {
      allowed: false,
      message: `Cannot transition from "${currentStatus}" to "${newStatus}". Allowed transitions: ${allowedTransitions.join(', ') || 'None'}`
    };
  }

  return { allowed: true, message: 'Transition allowed' };
};

/**
 * Check if order can be edited based on status
 * @param {string} status - Current order status
 * @returns {boolean}
 */
export const canEditOrder = (status) => {
  const editableStatuses = [ORDER_STATUSES.OPEN, ORDER_STATUSES.CONFIRMED];
  return editableStatuses.includes(status);
};

/**
 * Check if order is locked (no editing allowed)
 * @param {string} status - Current order status
 * @returns {boolean}
 */
export const isOrderLocked = (status) => {
  const lockedStatuses = [
    ORDER_STATUSES.IN_PRODUCTION,
    ORDER_STATUSES.READY_FOR_DISPATCH,
    ORDER_STATUSES.DISPATCHED,
    ORDER_STATUSES.DELIVERED,
    ORDER_STATUSES.CLOSED,
    ORDER_STATUSES.CANCELLED
  ];
  return lockedStatuses.includes(status);
};

/**
 * Check if order can be cancelled
 * @param {string} status - Current order status
 * @returns {boolean}
 */
export const canCancelOrder = (status) => {
  return status === ORDER_STATUSES.OPEN || status === ORDER_STATUSES.CONFIRMED;
};

/**
 * Check if order can be put on hold
 * @param {string} status - Current order status
 * @returns {boolean}
 */
export const canPutOnHold = (status) => {
  return [
    ORDER_STATUSES.OPEN,
    ORDER_STATUSES.CONFIRMED,
    ORDER_STATUSES.IN_PRODUCTION
  ].includes(status);
};

/**
 * Get required fields for status change
 * @param {string} newStatus - New status
 * @returns {Array<string>} Array of required field names
 */
export const getRequiredFieldsForStatus = (newStatus) => {
  const requirements = {
    [ORDER_STATUSES.ON_HOLD]: ['holdReason'],
    [ORDER_STATUSES.CANCELLED]: ['cancelReason'],
    [ORDER_STATUSES.DISPATCHED]: ['dispatchInfo.vehicleNumber', 'dispatchInfo.lrNumber', 'dispatchInfo.driverName', 'dispatchInfo.dispatchDate']
  };
  return requirements[newStatus] || [];
};
