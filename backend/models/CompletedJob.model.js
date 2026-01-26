import mongoose from 'mongoose';

const completedJobSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true
  },
  completedDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Ready For Dispatch'],
    default: 'Ready For Dispatch'
  }
}, {
  timestamps: true
});

const CompletedJob = mongoose.model('CompletedJob', completedJobSchema);
export default CompletedJob;
