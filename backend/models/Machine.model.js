import mongoose from 'mongoose';

const machineSchema = new mongoose.Schema({
  machineId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Machine name is required'],
    trim: true
  },
  machineCode: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  type: {
    type: String,
    trim: true
  },
  capacity: {
    type: String,
    trim: true
  },
  manufacturer: {
    type: String,
    trim: true
  },
  purchaseDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Active', 'Under Maintenance', 'Inactive', 'Retired'],
    default: 'Active'
  },
  specifications: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Auto-generate machineId
machineSchema.pre('save', async function(next) {
  if (!this.machineId) {
    const count = await mongoose.model('Machine').countDocuments();
    this.machineId = `MCH${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

const Machine = mongoose.model('Machine', machineSchema);
export default Machine;
