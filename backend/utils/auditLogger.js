import AuditLog from '../models/AuditLog.model.js';

export const logAudit = async (userId, action, module, recordId = null, details = {}) => {
  try {
    await AuditLog.create({
      userId,
      action,
      module,
      recordId,
      details
    });
  } catch (error) {
    console.error('Audit logging failed:', error);
    // Don't throw error - audit logging should not break the main flow
  }
};
