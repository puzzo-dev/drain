import { Router, Request, Response } from 'express';
import { drainQueue } from '../queues';

const router = Router();

// Get queue stats
router.get('/queue', async (req: Request, res: Response) => {
  try {
    const [waiting, active, completed, failed] = await Promise.all([
      drainQueue.getWaitingCount(),
      drainQueue.getActiveCount(),
      drainQueue.getCompletedCount(),
      drainQueue.getFailedCount()
    ]);
    
    res.json({
      queue: {
        waiting,
        active,
        completed,
        failed
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
