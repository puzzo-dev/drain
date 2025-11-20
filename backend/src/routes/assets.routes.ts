import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { custodyService } from '../services/custody.service';
import { logger } from '../utils/logger';

const router = Router();

// Get all held assets for current user
router.get('/held', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { network } = req.query;
    
    const assets = await custodyService.getHeldAssets(
      userId,
      network as string | undefined
    );
    
    const totalValue = await custodyService.getTotalHeldValue(userId);
    
    res.json({
      assets,
      totalValue,
      count: assets.length
    });
    
  } catch (error: any) {
    logger.error('Error fetching held assets:', error);
    res.status(500).json({ error: 'Failed to fetch assets', details: error.message });
  }
});

// Get held assets by network
router.get('/held/:network', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { network } = req.params;
    
    const assets = await custodyService.getHeldAssets(userId, network);
    
    res.json({
      network,
      assets,
      count: assets.length
    });
    
  } catch (error: any) {
    logger.error(`Error fetching ${req.params.network} assets:`, error);
    res.status(500).json({ error: 'Failed to fetch assets', details: error.message });
  }
});

export default router;
