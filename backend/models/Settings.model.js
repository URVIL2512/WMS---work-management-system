import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  // Company Basic Information
  companyName: {
    type: String,
    trim: true
  },
  tagline: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  // Company Address
  addressLine1: {
    type: String,
    trim: true
  },
  addressLine2: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  pincode: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true,
    default: 'India'
  },
  // Tax Information
  gstin: {
    type: String,
    trim: true
  },
  pan: {
    type: String,
    trim: true
  },
  // Bank Details
  bankName: {
    type: String,
    trim: true
  },
  accountNumber: {
    type: String,
    trim: true
  },
  ifsc: {
    type: String,
    trim: true
  },
  branch: {
    type: String,
    trim: true
  },
  // Default Settings
  defaultGst: {
    type: Number,
    default: 18,
    min: 0,
    max: 100
  },
  quotationValidityDays: {
    type: Number,
    default: 30,
    min: 1
  },
  defaultPaymentTerms: {
    type: String,
    trim: true
  },
  footerNote: {
    type: String,
    trim: true
  },
  // Legacy fields for backward compatibility
  logoUrl: {
    type: String,
    trim: true
  },
  defaultTerms: {
    type: String,
    trim: true
  },
  systemPreferences: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Singleton pattern - only one settings document
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;
