import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import adminCardsRouter from './routes/adminCards';
import searchRouter from './routes/search';
import authRouter from './routes/auth';
import userCardsRouter from './routes/userCards';
import packsRouter from './routes/packs';
import importRouter from './routes/import';
import adminUsersRouter from './routes/adminUsers';
import { getCardPresentation } from './controllers/cardsController';
import { getQueueStats } from './queue';
import { requireAdmin, AuthRequest } from './middleware/auth';
import { config } from './config/env';

// Load environment variables
dotenv.config();

const app = express();

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (config.corsOrigins === '*') {
      callback(null, true);
      return;
    }

    if (!origin) {
      callback(null, true);
      return;
    }

    if (config.corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('CORS origin denied'));
  },
};

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (images, thumbnails)
app.use('/uploads', express.static('uploads'));
app.use('/thumbnails', express.static('uploads/thumbnails'));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Queue stats endpoint (admin only)
app.get('/api/admin/queue/stats', requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const stats = await getQueueStats();
    res.json(stats);
  } catch {
    res.status(500).json({ error: 'Failed to fetch queue stats' });
  }
});

// Public API routes
app.get('/api/cards/:id/presentation', getCardPresentation);
app.use('/api/search', searchRouter);

// Auth routes
app.use('/api/auth', authRouter);

// User collection
app.use('/api', userCardsRouter);

// Pack store
app.use('/api/packs', packsRouter);

// Bird import (admin)
app.use('/api/admin/import', importRouter);

// Admin routes
app.use('/api/admin', adminCardsRouter);
app.use('/api/admin/users', adminUsersRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: unknown) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : undefined,
  });
});

// Start server
app.listen(config.port, () => {
  console.log(`KYNDO Backend API running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Health check: http://localhost:${config.port}/health`);
});

export default app;
