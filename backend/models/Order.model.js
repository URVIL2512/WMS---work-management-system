import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  soNumber: {
    type: String,
    required: true,
    unique: true
  },
  quotationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quotation',
    required: false // Allow orders without quotations
  },
  quotationNumber: {
    type: String,
    required: false // Allow orders without quotations
  },
  // Customer reference
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: false // Will be required for new orders
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  contactNumber: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  // Legacy fields for backward compatibility
  itemName: {
    type: String,
    required: false, // Now optional, use items array instead
    trim: true
  },
  itemDescription: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: false, // Now optional, use items array instead
    min: 1
  },
  // New structure: Items with Processes
  items: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true
    },
    itemName: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    rate: {
      type: Number,
      default: 0,
      min: 0
    },
    itemTotal: {
      type: Number,
      required: true,
      min: 0
    },
    processes: [{
      processId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Master',
        required: false // Process Master reference
      },
      processName: {
        type: String,
        required: true,
        trim: true
      },
      rate: {
        type: Number,
        required: true,
        min: 0
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      amount: {
        type: Number,
        required: true,
        min: 0
      }
    }]
  }],
  // Legacy processes array for backward compatibility
  processes: [{
    processName: {
      type: String,
      required: false, // Now optional, use items[].processes instead
      trim: true
    },
    rate: {
      type: Number,
      required: false,
      min: 0
    }
  }],
  gstPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  packagingCost: {
    type: Number,
    default: 0,
    min: 0
  },
  transportCost: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentTerms: {
    type: String,
    trim: true
  },
  // Delivery fields (editable)
  deliveryDate: {
    type: Date
  },
  deliveryAddress: {
    type: String,
    trim: true
  },
  expectedDispatchDate: {
    type: Date
  },
  remarks: {
    type: String,
    trim: true
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Open', 'Confirmed', 'In Production', 'Ready For Dispatch', 'Dispatched', 'Delivered', 'Closed', 'On Hold', 'Cancelled'],
    default: 'Open'
  },
  // Status change tracking
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    reason: {
      type: String,
      trim: true
    }
  }],
  // Hold/Cancel reasons
  holdReason: {
    type: String,
    trim: true
  },
  cancelReason: {
    type: String,
    trim: true
  },
  // Dispatch information
  dispatchInfo: {
    vehicleNumber: {
      type: String,
      trim: true
    },
    lrNumber: {
      type: String,
      trim: true
    },
    driverName: {
      type: String,
      trim: true
    },
    dispatchDate: {
      type: Date
    }
  },
  // Delivery tracking
  deliveredAt: {
    type: Date
  },
  deliveredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Invoice tracking
  invoiceGenerated: {
    type: Boolean,
    default: false
  },
  invoiceNumber: {
    type: String,
    trim: true
  },
  // Payment tracking
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Partial', 'Completed'],
    default: 'Pending'
  },
  // Data locking flags
  isLocked: {
    type: Boolean,
    default: false
  },
  lockedAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
