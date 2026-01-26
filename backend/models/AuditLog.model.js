import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['Create', 'Update', 'Delete', 'Status Change', 'Login', 'Logout', 'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET']
  },
  module: {
    type: String,
    required: true
  },
  recordId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// Index for faster queries
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ module: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
