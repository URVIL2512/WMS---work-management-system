import mongoose from 'mongoose';

const dispatchSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true
  },
  transportName: {
    type: String,
    required: [true, 'Transport name is required'],
    trim: true
  },
  lrNumber: {
    type: String,
    required: [true, 'LR Number is required'],
    trim: true
  },
  dispatchDate: {
    type: Date,
    default: Date.now
  },
  dispatchedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Dispatched'],
    default: 'Dispatched'
  }
}, {
  timestamps: true
});

const Dispatch = mongoose.model('Dispatch', dispatchSchema);
export default Dispatch;
