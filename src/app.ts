import express, { type Request, type Response } from 'express';
import cors from 'cors';
import env from './config/env';
import errorHandler from './middleware/errorHandler';
import rateLimiter from './middleware/rateLimiter';
import idempotencyMiddleware from './middleware/idempotencyMiddleware';
import inventoryRoutes from './inventory/inventoryRoutes';
import pricingRoutes from './pricing/pricingRoutes';
import orderRoutes from './orders/orderRoutes';
import paymentRoutes from './payments/paymentRoutes';
import { formatSuccess } from './utils/responseFormatter';

const app = express();

app.use(cors());
app.use(express.json());
app.use(rateLimiter);

app.get('/', (_req: Request, res: Response) => {
  res.json(formatSuccess({
    name: 'Ecommerce Order Management Engine',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      inventory: 'GET/POST /api/inventory',
      pricing: 'GET/POST /api/pricing',
      orders: 'GET/POST /api/orders',
      payments: 'POST/GET /api/payments',
    },
  }));
});

app.get('/health', (_req: Request, res: Response) => {
  res.json(formatSuccess({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() }));
});

app.use(idempotencyMiddleware);

app.use('/api/inventory', inventoryRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { message: `Route ${req.method} ${req.path} not found` },
    statusCode: 404,
  });
});

app.use(errorHandler);

export default app;
