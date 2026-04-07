const { prisma } = require('./prisma');
const logger = require('./logger');

const auditLog = {
  async log({ userId, action, entityType, entityId, details = {}, req }) {
    try {
      await prisma.auditLog.create({
        data: {
          user_id: userId,
          action,
          entity_type: entityType,
          entity_id: entityId,
          details,
          ip_address: req?.ip || req?.connection?.remoteAddress || 'unknown',
          user_agent: req?.get('user-agent') || 'unknown',
        },
      });
    } catch (err) {
      logger.error('Failed to create audit log:', err.message);
      // Don't throw - audit logging should never break the app
    }
  },

  async getAuditTrail(entityType, entityId, limit = 50) {
    return prisma.auditLog.findMany({
      where: { entity_type: entityType, entity_id: entityId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  },

  async getUserActivity(userId, limit = 100) {
    return prisma.auditLog.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  },
};

module.exports = auditLog;
