import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  departmentId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  headOfDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Auto-generate departmentId
departmentSchema.pre('save', async function(next) {
  if (!this.departmentId) {
    const count = await mongoose.model('Department').countDocuments();
    this.departmentId = `DEPT${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

const Department = mongoose.model('Department', departmentSchema);
export default Department;
