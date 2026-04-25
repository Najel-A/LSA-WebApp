import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types';
import { triageFeedbackService } from './triageFeedback.service';

type TriageFeedbackBody = {
  incidentId?: unknown;
  incidentTitle?: unknown;
  diagnosisCorrectness?: unknown;
  fixUsefulness?: unknown;
  actualRootCause?: unknown;
  actualFix?: unknown;
  notes?: unknown;
};

function isDiagnosisCorrectness(v: unknown): v is 'correct' | 'partial' | 'incorrect' {
  return v === 'correct' || v === 'partial' || v === 'incorrect';
}

function isFixUsefulness(v: unknown): v is 'useful' | 'partial' | 'not_useful' {
  return v === 'useful' || v === 'partial' || v === 'not_useful';
}

export async function upsertTriageFeedback(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userEmail = req.user?.email;
  if (!userEmail) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const body = (req.body ?? {}) as TriageFeedbackBody;

  if (typeof body.incidentId !== 'string' || body.incidentId.trim() === '') {
    res.status(400).json({ error: 'incidentId is required' });
    return;
  }
  if (!isDiagnosisCorrectness(body.diagnosisCorrectness)) {
    res.status(400).json({ error: 'diagnosisCorrectness is required' });
    return;
  }
  if (!isFixUsefulness(body.fixUsefulness)) {
    res.status(400).json({ error: 'fixUsefulness is required' });
    return;
  }

  const doc = await triageFeedbackService.upsert({
    incidentId: body.incidentId,
    incidentTitle: typeof body.incidentTitle === 'string' ? body.incidentTitle : undefined,
    userEmail,
    diagnosisCorrectness: body.diagnosisCorrectness,
    fixUsefulness: body.fixUsefulness,
    actualRootCause: typeof body.actualRootCause === 'string' ? body.actualRootCause : '',
    actualFix: typeof body.actualFix === 'string' ? body.actualFix : '',
    notes: typeof body.notes === 'string' ? body.notes : '',
  });

  res.json(doc);
}

export async function getMyTriageFeedback(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userEmail = req.user?.email;
  if (!userEmail) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const rows = await triageFeedbackService.listForUser(userEmail);
  res.json(rows);
}

export async function getTriageFeedbackForIncident(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userEmail = req.user?.email;
  if (!userEmail) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const incidentId = req.params.incidentId;
  if (!incidentId) {
    res.status(400).json({ error: 'incidentId is required' });
    return;
  }
  const row = await triageFeedbackService.getForIncident(incidentId, userEmail);
  res.json(row);
}

