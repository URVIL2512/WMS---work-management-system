import mongoose from 'mongoose';

const jobWorkSchema = new mongoose.Schema({
  jobWorkId: {
    type: String,
    required: true,
    unique: true
  },
  workOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkOrder',
    required: true
  },
  vendorName: {
    type: String,
    required: [true, 'Vendor name is required'],
    trim: true
  },
  challanNumber: {
    type: String,
    trim: true
  },
  process: {
    type: String,
    required: [true, 'Process is required'],
    trim: true
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  quantitySent: {
    type: Number,
    required: [true, 'Quantity sent is required'],
    min: 1
  },
  quantityReceived: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['Sent', 'In Process', 'Returned'],
    default: 'Sent'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const JobWork = mongoose.model('JobWork', jobWorkSchema);
export default JobWork;
