import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { runIncidentAnalysis } from './incidents.orchestrator';
import { incidentsService } from './incidents.service';

function toIncidentId(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  if (!mongoose.isValidObjectId(v)) return null;
  return v;
}

function mapAnalysis(doc: any) {
  return {
    incidentId: String(doc._id),
    evidenceText: doc.evidenceText,
    status: doc.status,
    agentOutputs: doc.agentOutputs,
    reconcilerOutput: doc.reconcilerOutput,
    validationOutput: doc.validationOutput,
    finalRecommendation: doc.finalRecommendation,
    humanReview: doc.humanReview,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
  };
}

export async function analyzeIncident(req: Request, res: Response): Promise<void> {
  const incidentId = toIncidentId(req.params.id);
  if (!incidentId) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }

  // If already running or previously completed, return current state quickly.
  const existing = await incidentsService.getIncidentById(incidentId);
  if (!existing) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }

  const anyRunning =
    existing.agentOutputs?.agent1?.status === 'running' ||
    existing.agentOutputs?.agent2?.status === 'running' ||
    existing.reconcilerOutput?.status === 'running' ||
    existing.validationOutput?.status === 'running';

  if (anyRunning) {
    res.status(202).json(mapAnalysis(existing));
    return;
  }

  const result = await runIncidentAnalysis(incidentId);
  if (!result.ok) {
    if (result.status === 'running') {
      const latest = await incidentsService.getIncidentById(incidentId);
      res.status(202).json(latest ? mapAnalysis(latest) : { error: 'Running' });
      return;
    }
    if (result.status === 'not_found') {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    if (result.status === 'invalid_id') {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }
    res.status(500).json({ error: result.message });
    return;
  }

  const latest = await incidentsService.getIncidentById(incidentId);
  res.json(latest ? mapAnalysis(latest) : { incidentId, finalRecommendation: result.finalRecommendation });
}

