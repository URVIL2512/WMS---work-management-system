import mongoose from 'mongoose';

const masterSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['Customer', 'Vendor', 'Process', 'Transport', 'Item']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  additionalFields: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound index for type and name uniqueness
masterSchema.index({ type: 1, name: 1 }, { unique: true });

const Master = mongoose.model('Master', masterSchema);
export default Master;
