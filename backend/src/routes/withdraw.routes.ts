import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { mixingService } from '../services/mixing.service';
import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';

const router = Router();

// Create withdrawal request
router.post('/request', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const {
      network,
      assetAddress,
      symbol,
      amount,
      destinationAddress,
      hops // Optional: override default hop count
    } = req.body;
    
    if (!network || !assetAddress || !symbol || !amount || !destinationAddress) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create withdrawal with mixing
    const requestId = await mixingService.createWithdrawalRequest(
      userId,
      network,
      assetAddress,
      symbol,
      amount,
      destinationAddress,
      hops ? { minHops: hops, maxHops: hops } : undefined
    );
    
    logger.info(`Withdrawal request created: ${requestId}`);
    
    res.json({
      requestId,
      status: 'pending',
      message: 'Withdrawal queued for processing with privacy mixing'
    });
    
  } catch (error: any) {
    logger.error('Withdrawal request error:', error);
    res.status(500).json({ error: 'Failed to create withdrawal', details: error.message });
  }
});

// Get withdrawal status
router.get('/:requestId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const userId = req.userId!;
    
    const request = await prisma.withdrawalRequest.findFirst({
      where: {
        id: requestId,
        userId // Ensure user owns this request
      },
      include: {
        mixingHops: {
          orderBy: { hopNumber: 'asc' }
        }
      }
    });
    
    if (!request) {
      return res.status(404).json({ error: 'Withdrawal request not found' });
    }
    
    res.json({
      id: request.id,
      network: request.network,
      asset: request.symbol,
      amount: request.amount,
      destinationAddress: request.destinationAddress,
      status: request.status,
      progress: {
        completed: request.hopsCompleted,
        total: request.totalHops,
        percentage: Math.round((request.hopsCompleted / request.totalHops) * 100)
      },
      hops: request.mixingHops.map(hop => ({
        hopNumber: hop.hopNumber,
        from: hop.fromAddress,
        to: hop.toAddress,
        txHash: hop.txHash,
        status: hop.status,
        executedAt: hop.executedAt
      })),
      requestedAt: request.requestedAt,
      completedAt: request.completedAt,
      error: request.error
    });
    
  } catch (error: any) {
    logger.error('Error fetching withdrawal status:', error);
    res.status(500).json({ error: 'Failed to fetch status', details: error.message });
  }
});

// List user's withdrawal history
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    
    const requests = await prisma.withdrawalRequest.findMany({
      where: { userId },
      orderBy: { requestedAt: 'desc' },
      take: 50
    });
    
    res.json({
      requests: requests.map(r => ({
        id: r.id,
        network: r.network,
        asset: r.symbol,
        amount: r.amount,
        destinationAddress: r.destinationAddress,
        status: r.status,
        progress: `${r.hopsCompleted}/${r.totalHops}`,
        requestedAt: r.requestedAt,
        completedAt: r.completedAt
      })),
      count: requests.length
    });
    
  } catch (error: any) {
    logger.error('Error fetching withdrawal history:', error);
    res.status(500).json({ error: 'Failed to fetch history', details: error.message });
  }
});

export default router;
