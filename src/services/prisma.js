const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
});

// Log slow queries (> 1 second)
prisma.$on('query', (e) => {
  if (e.duration > 1000) {
    logger.warn(`Slow query detected (${e.duration}ms): ${e.query}`);
  }
});

prisma.$on('error', (e) => {
  logger.error('Prisma error:', e.message);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Disconnecting Prisma...');
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Disconnecting Prisma...');
  await prisma.$disconnect();
});

// Named export to match existing destructured imports
module.exports = { prisma };
