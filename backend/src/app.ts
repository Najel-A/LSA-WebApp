import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import { authRoutes } from './auth/auth.routes';
import { userRoutes } from './users/user.routes';
import { triageFeedbackRoutes } from './triageFeedback/triageFeedback.routes';
import { alertsRoutes } from './alerts/alerts.routes';
import { incidentsRoutes } from './incidents/incidents.routes';

/**
 * Build and return the Express app. Kept separate from server.ts for testing
 * and future AWS Lambda / serverless integration.
 */
export function createApp(): express.Application {
  const app = express();

  app.use(morgan('dev')); // Logs: METHOD path status response-time ms
  app.use(cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  }));
  app.use(express.json());

  // Health check first (useful for load balancers / AWS)
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Route prefixes — auth and users namespaced for clarity
  app.use('/auth', authRoutes);
  app.use('/users', userRoutes);
  app.use('/api/triage-feedback', triageFeedbackRoutes);
  app.use('/api/alerts', alertsRoutes);
  app.use('/api/incidents', incidentsRoutes);

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
