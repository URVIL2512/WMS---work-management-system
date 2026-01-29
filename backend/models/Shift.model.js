import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema({
  shiftId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Shift name is required'],
    trim: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['Day', 'Night', 'General'],
    required: true
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required']
  },
  breakDuration: {
    type: Number, // in minutes
    default: 0
  },
  workingHours: {
    type: Number, // calculated field
    default: 8
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

// Auto-generate shiftId
shiftSchema.pre('save', async function(next) {
  if (!this.shiftId) {
    const count = await mongoose.model('Shift').countDocuments();
    this.shiftId = `SFT${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

const Shift = mongoose.model('Shift', shiftSchema);
export default Shift;
