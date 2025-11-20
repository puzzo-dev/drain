import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { drainQueue } from './queues';
import { logger } from './utils/logger';
import './utils/api-key-monitor'; // Check API key expiry on startup
import authRoutes from './routes/auth.routes';
import drainRoutes from './routes/drain.routes';
import statusRoutes from './routes/status.routes';
import assetsRoutes from './routes/assets.routes';
import withdrawRoutes from './routes/withdraw.routes';
import configRoutes from './routes/config.routes';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/drain', drainRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/withdraw', withdrawRoutes);
app.use('/api/config', configRoutes);

// WebSocket for real-time updates
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('subscribe:job', (jobId: string) => {
    socket.join(`job:${jobId}`);
    logger.info(`Client ${socket.id} subscribed to job ${jobId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Export io for use in workers
export { io };

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  logger.info(`🚀 API Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await drainQueue.close();
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});
