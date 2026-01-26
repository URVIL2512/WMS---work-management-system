import mongoose from 'mongoose';

const internalProcessSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true
  },
  balancing: {
    completed: {
      type: Boolean,
      default: false
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completedAt: {
      type: Date
    }
  },
  cleaning: {
    completed: {
      type: Boolean,
      default: false
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completedAt: {
      type: Date
    }
  },
  assembly: {
    completed: {
      type: Boolean,
      default: false
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completedAt: {
      type: Date
    }
  },
  packaging: {
    completed: {
      type: Boolean,
      default: false
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completedAt: {
      type: Date
    }
  }
}, {
  timestamps: true
});

const InternalProcess = mongoose.model('InternalProcess', internalProcessSchema);
export default InternalProcess;
