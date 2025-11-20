import express from 'express';
import {
  getPublicConfig,
  getAllConfig,
  updateConfig,
  initializeConfig,
} from '../controllers/config.controller';

const router = express.Router();

/**
 * Public routes - accessible without authentication
 */

// Get public configuration for frontend
router.get('/public', getPublicConfig);

/**
 * Admin routes - require authentication
 * TODO: Add authentication middleware
 */

// Get all configuration (admin only)
router.get('/admin/all', /* authMiddleware, adminMiddleware, */ getAllConfig);

// Update specific configuration (admin only)
router.put('/admin/:key', /* authMiddleware, adminMiddleware, */ updateConfig);

// Initialize configuration with defaults (admin only, run once)
router.post(
  '/admin/init',
  /* authMiddleware, adminMiddleware, */ initializeConfig,
);

export default router;
