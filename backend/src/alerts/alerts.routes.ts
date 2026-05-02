import { Router } from 'express';
import { createAlert, getAlertById, ingestAlert, listAlerts, seedAlerts } from './alerts.controller';
import { requireIngestApiKey } from './alerts.ingest.middleware';

export const alertsRoutes = Router();

alertsRoutes.get('/', listAlerts);
alertsRoutes.get('/:id', getAlertById);

// Internal/manual creation (no API key)
alertsRoutes.post('/', createAlert);

// External ingestion (API-key protected)
alertsRoutes.post('/ingest', requireIngestApiKey, ingestAlert);

// Dev-only seeding route (disabled in production by controller guard)
alertsRoutes.post('/seed', seedAlerts);

