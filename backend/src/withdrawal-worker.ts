import Bull from 'bull';
import dotenv from 'dotenv';
import { withdrawalQueue } from './queues';
import { logger } from './utils/logger';
import './utils/api-key-monitor'; // Check API key expiry on startup
import { prisma } from './db/prisma';
import { mixingService } from './services/mixing.service';

dotenv.config();

withdrawalQueue.process(async (job: Bull.Job) => {
  const { requestId } = job.data;
  
  logger.info(`Processing withdrawal request ${requestId}`);
  
  try {
    // Get withdrawal request with all hops
    const request = await prisma.withdrawalRequest.findUnique({
      where: { id: requestId },
      include: {
        mixingHops: {
          where: { status: 'pending' },
          orderBy: { hopNumber: 'asc' }
        }
      }
    });
    
    if (!request) {
      throw new Error(`Withdrawal request ${requestId} not found`);
    }
    
    if (request.status !== 'pending' && request.status !== 'mixing') {
      logger.warn(`Request ${requestId} already processed (${request.status})`);
      return;
    }
    
    // Update status to mixing
    await prisma.withdrawalRequest.update({
      where: { id: requestId },
      data: {
        status: 'mixing',
        startedAt: new Date()
      }
    });
    
    // Execute each hop sequentially
    for (const hop of request.mixingHops) {
      await mixingService.executeHop(hop.id);
      
      // Update job progress
      const progress = ((hop.hopNumber / request.totalHops) * 100).toFixed(1);
      await job.progress(Number(progress));
      
      logger.info(`Withdrawal ${requestId}: Hop ${hop.hopNumber}/${request.totalHops} completed`);
    }
    
    logger.info(`Withdrawal request ${requestId} completed successfully`);
    
    return {
      success: true,
      requestId,
      hopsCompleted: request.totalHops
    };
    
  } catch (error: any) {
    logger.error(`Withdrawal request ${requestId} failed:`, error);
    
    await prisma.withdrawalRequest.update({
      where: { id: requestId },
      data: {
        status: 'failed',
        error: error.message
      }
    });
    
    throw error;
  }
});

withdrawalQueue.on('completed', (job: Bull.Job, result: any) => {
  logger.info(`Withdrawal job ${job.id} completed`, result);
});

withdrawalQueue.on('failed', (job: Bull.Job, err: Error) => {
  logger.error(`Withdrawal job ${job?.id} failed:`, err);
});

withdrawalQueue.on('error', (error: Error) => {
  logger.error('Withdrawal queue error:', error);
});

logger.info('🔨 Withdrawal worker started');

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Withdrawal worker shutting down...');
  await withdrawalQueue.close();
  process.exit(0);
});
