import { Router, Request, Response } from 'express';
import { drainQueue } from '../queue';
import { logger } from '../utils/logger';
import { DrainJobData } from '../types';

const router = Router();

// Create new drain request
router.post('/request', async (req: Request, res: Response) => {
  try {
    const { network, sourceAddress, destinationAddress, assets, privateKey, options } = req.body;
    
    // Validation
    if (!network || !sourceAddress || !destinationAddress || !privateKey) {
      return res.status(400).json({ 
        error: 'Missing required fields' 
      });
    }
    
    // Create job
    const job = await drainQueue.add({
      network,
      sourceAddress,
      destinationAddress,
      assets: assets || 'all',
      privateKey, // Should be encrypted client-side
      options
    });
    
    logger.info(`Drain job created: ${job.id}`, { sourceAddress, network });
    
    res.json({
      jobId: job.id,
      status: 'queued',
      message: 'Drain request accepted and queued for processing'
    });
    
  } catch (error: any) {
    logger.error('Error creating drain job:', error);
    res.status(500).json({ 
      error: 'Failed to create drain request',
      details: error.message 
    });
  }
});

// Get job status
router.get('/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const job = await drainQueue.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const state = await job.getState();
    const progress = job.progress();
    const result = job.returnvalue;
    
    res.json({
      jobId: job.id,
      state,
      progress,
      data: job.data,
      result,
      createdAt: job.timestamp,
      finishedAt: job.finishedOn
    });
    
  } catch (error: any) {
    logger.error('Error fetching job status:', error);
    res.status(500).json({ 
      error: 'Failed to fetch job status',
      details: error.message 
    });
  }
});

export default router;
