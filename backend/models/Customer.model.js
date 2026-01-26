import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema({
  customerId: {
    type: String,
    unique: true,
    required: false, // Will be auto-generated in pre-save hook
    trim: true
  },
  // Basic Info
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  contactPerson: {
    type: String,
    trim: true
  },
  mobile: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v);
      },
      message: 'Mobile number must be exactly 10 digits'
    }
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Email is optional
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  customerType: {
    type: String,
    enum: ['Individual', 'Business', 'Dealer'],
    default: 'Business'
  },
  // Billing Address
  billingAddressLine1: {
    type: String,
    trim: true
  },
  billingAddressLine2: {
    type: String,
    trim: true
  },
  billingCity: {
    type: String,
    trim: true
  },
  billingState: {
    type: String,
    trim: true
  },
  billingCountry: {
    type: String,
    trim: true,
    default: 'India'
  },
  billingPincode: {
    type: String,
    trim: true
  },
  // Shipping Address
  isShippingSameAsBilling: {
    type: Boolean,
    default: true
  },
  shippingAddressLine1: {
    type: String,
    trim: true
  },
  shippingAddressLine2: {
    type: String,
    trim: true
  },
  shippingCity: {
    type: String,
    trim: true
  },
  shippingState: {
    type: String,
    trim: true
  },
  shippingCountry: {
    type: String,
    trim: true,
    default: 'India'
  },
  shippingPincode: {
    type: String,
    trim: true
  },
  // GST & Tax
  gstNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  panNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  placeOfSupply: {
    type: String,
    trim: true
  },
  gstType: {
    type: String,
    enum: ['Registered', 'Unregistered', 'Composition', 'SEZ', 'Export'],
    default: 'Registered'
  },
  // Payment Settings
  paymentTerms: {
    type: String,
    enum: ['Advance', 'Net15', 'Net30', 'Custom'],
    default: 'Net30'
  },
  creditLimit: {
    type: Number,
    default: 0,
    min: 0
  },
  outstandingBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    trim: true
  },
  // System Fields
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Blocked'],
    default: 'Active'
  },
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for duplicate prevention
CustomerSchema.index({ mobile: 1 });
CustomerSchema.index({ gstNumber: 1 }, { sparse: true });

// Pre-save hook to generate customerId
CustomerSchema.pre('save', async function(next) {
  if (!this.customerId || this.customerId.trim() === '') {
    try {
      // Get the Customer model to avoid circular dependency
      const CustomerModel = this.constructor;
      const count = await CustomerModel.countDocuments();
      this.customerId = `CUST${String(count + 1).padStart(5, '0')}`;
    } catch (error) {
      // Fallback: use timestamp if count fails
      this.customerId = `CUST${Date.now().toString().slice(-5)}`;
    }
  }
  next();
});

// GST validation for Registered customers
CustomerSchema.pre('save', function(next) {
  if (this.gstType === 'Registered' && this.gstNumber) {
    // Basic GST validation (15 characters, alphanumeric)
    if (!/^[0-9A-Z]{15}$/.test(this.gstNumber)) {
      return next(new Error('GST Number must be 15 characters alphanumeric for Registered customers'));
    }
  }
  next();
});

export default mongoose.model('Customer', CustomerSchema);
