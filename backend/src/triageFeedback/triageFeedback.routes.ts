import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import {
  getMyTriageFeedback,
  getTriageFeedbackForIncident,
  upsertTriageFeedback,
} from './triageFeedback.controller';

export const triageFeedbackRoutes = Router();

triageFeedbackRoutes.use(requireAuth);

// List for current user (email from JWT)
triageFeedbackRoutes.get('/me', getMyTriageFeedback);

// Load feedback for an incident for current user
triageFeedbackRoutes.get('/incident/:incidentId', getTriageFeedbackForIncident);

// Upsert feedback for an incident for current user
triageFeedbackRoutes.post('/', upsertTriageFeedback);

