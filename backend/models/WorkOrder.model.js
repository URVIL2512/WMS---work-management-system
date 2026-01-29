import mongoose from 'mongoose';

// Inhouse Job Card Schema
const inhouseJobCardSchema = new mongoose.Schema({
  jobCardNumber: {
    type: String,
    unique: true
  },
  processName: {
    type: String,
    required: true
  },
  processId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Master'
  },
  productName: {
    type: String,
    required: true
  },
  plannedQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  assignedQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  completedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  machineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine'
  },
  operatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  shiftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  startDate: {
    type: Date,
    required: true
  },
  targetDate: {
    type: Date,
    required: true
  },
  actualStartDate: {
    type: Date
  },
  actualEndDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Pending', 'Started', 'In Progress', 'Completed', 'QC Approved', 'On Hold', 'Cancelled'],
    default: 'Pending'
  },
  remarks: {
    type: String
  },
  sequence: {
    type: Number,
    default: 1
  }
}, { _id: true });

// Outside Job Work Schema
const outsideJobWorkSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Master',
    required: true
  },
  vendorName: {
    type: String,
    required: true
  },
  processName: {
    type: String,
    required: true
  },
  processId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Master'
  },
  productName: {
    type: String,
    required: true
  },
  quantitySent: {
    type: Number,
    required: true,
    min: 0
  },
  quantityReceived: {
    type: Number,
    default: 0,
    min: 0
  },
  pendingQuantity: {
    type: Number,
    default: 0
  },
  challanNumber: {
    type: String,
    required: true
  },
  expectedReturnDate: {
    type: Date,
    required: true
  },
  actualReturnDate: {
    type: Date
  },
  transportMode: {
    type: String
  },
  vehicleNumber: {
    type: String
  },
  status: {
    type: String,
    enum: ['Sent', 'Received Partial', 'Received Completed', 'Closed', 'Cancelled'],
    default: 'Sent'
  },
  remarks: {
    type: String
  }
}, { _id: true });

// Main Work Order Schema
const workOrderSchema = new mongoose.Schema({
  workOrderId: {
    type: String,
    required: true,
    unique: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  orderNumber: {
    type: String
  },
  quotationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quotation'
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item'
  },
  itemName: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  orderQuantity: {
    type: Number,
    required: [true, 'Order quantity is required'],
    min: 1
  },
  totalQuantity: {
    type: Number,
    required: true,
    min: 1
  },
  completedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  pendingQuantity: {
    type: Number,
    default: 0
  },
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  workTypes: {
    type: [String],
    enum: ['Inhouse', 'Outside'],
    required: true
  },
  inhouseJobCards: [inhouseJobCardSchema],
  outsideJobWorks: [outsideJobWorkSchema],
  startDate: {
    type: Date,
    required: true
  },
  targetDate: {
    type: Date,
    required: true
  },
  actualCompletionDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Created', 'In Progress', 'Partial Completed', 'Completed', 'Closed', 'On Hold', 'Cancelled'],
    default: 'Created'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  linkedJobCards: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobCard'
  }],
  linkedOutwardChallans: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challan'
  }],
  remarks: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  modificationHistory: [{
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    modifiedAt: {
      type: Date,
      default: Date.now
    },
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    action: String
  }]
}, {
  timestamps: true
});

// Auto-generate workOrderId
workOrderSchema.pre('save', async function(next) {
  if (!this.workOrderId) {
    const count = await mongoose.model('WorkOrder').countDocuments();
    const year = new Date().getFullYear();
    this.workOrderId = `WO${year}${String(count + 1).padStart(5, '0')}`;
  }
  
  // Calculate pending quantity
  this.pendingQuantity = this.totalQuantity - this.completedQuantity;
  
  // Calculate completion percentage
  if (this.totalQuantity > 0) {
    this.completionPercentage = Math.round((this.completedQuantity / this.totalQuantity) * 100);
  }
  
  // Auto-update status based on completion
  if (this.completedQuantity === 0 && this.status === 'Created') {
    // Keep as Created
  } else if (this.completedQuantity > 0 && this.completedQuantity < this.totalQuantity) {
    this.status = 'Partial Completed';
  } else if (this.completedQuantity >= this.totalQuantity) {
    this.status = 'Completed';
  }
  
  next();
});

// Auto-generate job card numbers for inhouse jobs
workOrderSchema.pre('save', async function(next) {
  if (this.isModified('inhouseJobCards')) {
    for (let i = 0; i < this.inhouseJobCards.length; i++) {
      if (!this.inhouseJobCards[i].jobCardNumber) {
        const count = await mongoose.model('WorkOrder').countDocuments();
        this.inhouseJobCards[i].jobCardNumber = `${this.workOrderId}-JC${String(i + 1).padStart(3, '0')}`;
      }
      // Update pending quantity for job card
      this.inhouseJobCards[i].pendingQuantity = this.inhouseJobCards[i].assignedQuantity - this.inhouseJobCards[i].completedQuantity;
    }
  }
  
  // Update pending quantity for outside jobs
  if (this.isModified('outsideJobWorks')) {
    for (let i = 0; i < this.outsideJobWorks.length; i++) {
      this.outsideJobWorks[i].pendingQuantity = this.outsideJobWorks[i].quantitySent - this.outsideJobWorks[i].quantityReceived;
    }
  }
  
  next();
});

// Index for better query performance
workOrderSchema.index({ orderId: 1 });
workOrderSchema.index({ status: 1 });
workOrderSchema.index({ createdAt: -1 });
workOrderSchema.index({ 'inhouseJobCards.departmentId': 1 });
workOrderSchema.index({ 'outsideJobWorks.vendorId': 1 });

const WorkOrder = mongoose.model('WorkOrder', workOrderSchema);
export default WorkOrder;
