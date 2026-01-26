import mongoose from 'mongoose';

const jobCardSchema = new mongoose.Schema({
  jobCardId: {
    type: String,
    required: true,
    unique: true
  },
  workOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkOrder',
    required: true
  },
  processName: {
    type: String,
    required: [true, 'Process name is required'],
    trim: true
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: 1
  },
  department: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending'
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

const JobCard = mongoose.model('JobCard', jobCardSchema);
export default JobCard;
