import { Router } from 'express';
import { analyzeIncident } from './incidents.controller';

export const incidentsRoutes = Router();

// Trigger (or poll) the multi-agent RCA pipeline for a single incident (Alert doc).
incidentsRoutes.post('/:id/analyze', analyzeIncident);

