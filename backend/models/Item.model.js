import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema({
  itemId: {
    type: String,
    unique: true,
    required: false, // Will be auto-generated in pre-save hook
    trim: true,
    uppercase: true
  },
  
  // Basic Info
  itemName: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  itemCategory: {
    type: String,
    trim: true
  },
  itemType: {
    type: String,
    enum: ['Raw Material', 'Semi Finished', 'Finished Goods', 'Service'],
    default: 'Finished Goods'
  },
  description: {
    type: String,
    trim: true
  },
  
  // Pricing & Tax
  sellingPrice: {
    type: Number,
    required: [true, 'Selling price is required'],
    min: [0, 'Selling price cannot be negative']
  },
  purchasePrice: {
    type: Number,
    min: [0, 'Purchase price cannot be negative'],
    default: 0
  },
  gstPercent: {
    type: Number,
    min: [0, 'GST percent must be between 0 and 28'],
    max: [28, 'GST percent must be between 0 and 28'],
    default: 18
  },
  hsnSacCode: {
    type: String,
    trim: true
  },
  taxType: {
    type: String,
    enum: ['Taxable', 'Exempt', 'Zero Rated'],
    default: 'Taxable'
  },
  
  // Inventory
  unitOfMeasure: {
    type: String,
    enum: ['PCS', 'KG', 'MTR', 'BOX', 'SET'],
    default: 'PCS'
  },
  openingStock: {
    type: Number,
    min: [0, 'Opening stock cannot be negative'],
    default: 0
  },
  currentStock: {
    type: Number,
    min: [0, 'Current stock cannot be negative'],
    default: 0
  },
  minimumStockLevel: {
    type: Number,
    min: [0, 'Minimum stock level cannot be negative'],
    default: 0
  },
  warehouseLocation: {
    type: String,
    trim: true
  },
  trackInventory: {
    type: Boolean,
    default: true
  },
  
  // Production Related
  isManufacturable: {
    type: Boolean,
    default: false
  },
  defaultProcess: {
    type: String,
    trim: true
  },
  bomRequired: {
    type: Boolean,
    default: false
  },
  
  // Status & Control
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Discontinued'],
    default: 'Active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
ItemSchema.index({ itemId: 1 }, { unique: true });
ItemSchema.index({ itemName: 1 });
ItemSchema.index({ status: 1 });
ItemSchema.index({ itemType: 1 });

// Pre-save hook to auto-generate itemId
ItemSchema.pre('save', async function(next) {
  if (!this.itemId || this.itemId.trim() === '') {
    try {
      // Get the Item model to avoid circular dependency
      const ItemModel = this.constructor;
      const count = await ItemModel.countDocuments();
      const paddedNumber = String(count + 1).padStart(6, '0');
      this.itemId = `ITM${paddedNumber}`;
    } catch (error) {
      // Fallback: use timestamp if count fails
      this.itemId = `ITM${Date.now().toString().slice(-6)}`;
    }
  }
  
  // Auto-disable inventory tracking for Service items
  if (this.itemType === 'Service') {
    this.trackInventory = false;
  }
  
  // Set currentStock to openingStock if not set
  if (this.isNew && this.currentStock === 0 && this.openingStock > 0) {
    this.currentStock = this.openingStock;
  }
  
  next();
});

// Method to check if item can be manufactured
ItemSchema.methods.canManufacture = function() {
  return this.isManufacturable && this.status === 'Active';
};

const Item = mongoose.model('Item', ItemSchema);
export default Item;
