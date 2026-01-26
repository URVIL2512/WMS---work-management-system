import mongoose from 'mongoose';

const inspectionSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true
  },
  inspectorName: {
    type: String,
    required: [true, 'Inspector name is required'],
    trim: true
  },
  result: {
    type: String,
    enum: ['Pass', 'Fail'],
    required: [true, 'Inspection result is required']
  },
  remarks: {
    type: String,
    trim: true
  },
  inspectedAt: {
    type: Date,
    default: Date.now
  },
  inspectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const Inspection = mongoose.model('Inspection', inspectionSchema);
export default Inspection;
