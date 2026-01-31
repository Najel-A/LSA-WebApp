import express from 'express';
import { authRoutes } from './auth/auth.routes';
import { userRoutes } from './users/user.routes';

/**
 * Build and return the Express app. Kept separate from server.ts for testing
 * and future AWS Lambda / serverless integration.
 */
export function createApp(): express.Application {
  const app = express();

  app.use(express.json());

  // Health check first (useful for load balancers / AWS)
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Route prefixes — auth and users namespaced for clarity
  app.use('/auth', authRoutes);
  app.use('/users', userRoutes);

  // 404
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });

  // Global error handler — keep errors from leaking stack in production
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  return app;
}
