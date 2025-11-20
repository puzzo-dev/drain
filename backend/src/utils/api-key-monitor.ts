import { logger } from '../utils/logger';

const COVALENT_KEY_EXPIRY = process.env.COVALENT_KEY_EXPIRY || '2025-12-03';

export function checkApiKeyExpiry(): void {
  const expiryDate = new Date(COVALENT_KEY_EXPIRY);
  const now = new Date();
  const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry <= 0) {
    logger.error('🚨 CRITICAL: Covalent API key has EXPIRED! Token fetching will fail.');
    logger.error('🚨 Renew immediately at: https://www.covalenthq.com/platform/');
  } else if (daysUntilExpiry <= 7) {
    logger.warn(`⚠️  WARNING: Covalent API key expires in ${daysUntilExpiry} days (${COVALENT_KEY_EXPIRY})`);
    logger.warn('⚠️  Renew at: https://www.covalenthq.com/platform/');
  } else if (daysUntilExpiry <= 14) {
    logger.info(`ℹ️  Notice: Covalent API key expires in ${daysUntilExpiry} days (${COVALENT_KEY_EXPIRY})`);
  }
}

// Check on startup
checkApiKeyExpiry();

// Check daily
setInterval(() => {
  checkApiKeyExpiry();
}, 24 * 60 * 60 * 1000); // Every 24 hours
