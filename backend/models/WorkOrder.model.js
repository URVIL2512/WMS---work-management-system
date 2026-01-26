import mongoose from 'mongoose';

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
  itemName: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: 1
  },
  selectedTypes: {
    type: [String],
    enum: ['Inhouse', 'Outside'],
    required: true
  },
  plannedProcesses: {
    type: [String],
    default: []
  },
  startDate: {
    type: Date
  },
  targetDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Planned', 'Released'],
    default: 'Planned'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const WorkOrder = mongoose.model('WorkOrder', workOrderSchema);
export default WorkOrder;
