import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Employee name is required'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  designation: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['Operator', 'Supervisor', 'Manager', 'Technician', 'Helper'],
    default: 'Operator'
  },
  skills: {
    type: [String],
    default: []
  },
  shiftPreference: {
    type: String,
    enum: ['Day', 'Night', 'Rotating', 'Any'],
    default: 'Any'
  },
  joiningDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Active', 'On Leave', 'Inactive', 'Resigned'],
    default: 'Active'
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

// Auto-generate employeeId
employeeSchema.pre('save', async function(next) {
  if (!this.employeeId) {
    const count = await mongoose.model('Employee').countDocuments();
    this.employeeId = `EMP${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;
