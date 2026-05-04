import type { AgentOutput, ReconcilerOutput, ValidationOutput } from '../alerts/alerts.model';
import { incidentsService } from './incidents.service';

type RunResult =
  | { ok: true; incidentId: string; finalRecommendation?: string; validationOutput?: ValidationOutput }
  | { ok: false; incidentId: string; status: 'running' | 'failed' | 'not_found' | 'invalid_id'; message: string };

function buildEvidenceText(incident: any): string {
  if (typeof incident?.evidenceText === 'string' && incident.evidenceText.trim()) return incident.evidenceText;
  const title = typeof incident?.title === 'string' ? incident.title : '';
  const recent = Array.isArray(incident?.recentEvents)
    ? incident.recentEvents.map((e: any) => `${e.level ?? 'info'}: ${e.message}`).join('\n')
    : '';
  return [title, recent].filter(Boolean).join('\n\n').trim();
}

// TODO: Replace these stubs with real LLM/agent calls (FastAPI, OpenAI, etc).
async function runAgent1(evidenceText: string): Promise<Omit<AgentOutput, 'status' | 'startedAt' | 'completedAt'>> {
  return {
    diagnosis: `Stub diagnosis (agent1) based on evidence: ${evidenceText.slice(0, 120)}`,
    fixPlan: 'Stub fix plan (agent1): identify failing component, add null checks, add metrics, deploy.',
    actions: ['Inspect logs', 'Identify failing module', 'Apply fix', 'Add regression tests', 'Deploy'],
    confidence: 0.62,
    evidenceUsed: [evidenceText.slice(0, 200)],
    error: '',
  };
}

async function runAgent2(evidenceText: string): Promise<Omit<AgentOutput, 'status' | 'startedAt' | 'completedAt'>> {
  return {
    diagnosis: `Stub diagnosis (agent2) based on evidence: ${evidenceText.slice(0, 120)}`,
    fixPlan: 'Stub fix plan (agent2): reproduce, bisect, patch, add runbook entry.',
    actions: ['Reproduce', 'Bisect recent changes', 'Patch', 'Add runbook', 'Verify in staging'],
    confidence: 0.58,
    evidenceUsed: [evidenceText.slice(0, 200)],
    error: '',
  };
}

async function runReconciler(a1: AgentOutput, a2: AgentOutput): Promise<Omit<ReconcilerOutput, 'status' | 'completedAt'>> {
  const selected = (a1.confidence ?? 0) >= (a2.confidence ?? 0) ? a1 : a2;
  return {
    selectedDiagnosis: selected.diagnosis ?? '',
    selectedFixPlan: selected.fixPlan ?? '',
    comparisonNotes: `Selected proposal with higher confidence. a1=${a1.confidence ?? 0}, a2=${a2.confidence ?? 0}`,
    confidence: Math.max(a1.confidence ?? 0, a2.confidence ?? 0),
    error: '',
  };
}

async function runValidator(finalRecommendation: string): Promise<Omit<ValidationOutput, 'status' | 'completedAt'>> {
  const risky = /delete|drop\s+table|rm\s+-rf/i.test(finalRecommendation);
  return {
    isValid: !risky,
    riskLevel: risky ? 'high' : 'low',
    requiresHumanApproval: risky,
    validationNotes: risky
      ? 'Detected potentially destructive action; requires human approval.'
      : 'No obvious unsafe actions detected in recommendation.',
    error: '',
  };
}

function isComplete(o: any): boolean {
  return o && o.status === 'complete';
}

export async function runIncidentAnalysis(incidentId: string): Promise<RunResult> {
  const incident = await incidentsService.getIncidentById(incidentId);
  if (!incidentId || incidentId.trim() === '') {
    return { ok: false, incidentId, status: 'invalid_id', message: 'incidentId is required' };
  }
  if (!incident) {
    return { ok: false, incidentId, status: 'not_found', message: 'Incident not found' };
  }

  /**
   * Why we don't need a mutex:
   * - MongoDB updates to a single document are atomic.
   * - Each agent writes to its own nested namespace (disjoint $set paths), so Agent 1 and Agent 2 never contend.
   * - The orchestrator controls sequencing: reconciliation starts only after both agent outputs are complete.
   * - A stronger distributed lock is only necessary if multiple orchestrators/workers can run the same stage
   *   for the same incident concurrently; we add lightweight "already running" guards using conditional updates.
   */

  // If validation already completed, return current final.
  if (isComplete((incident as any).validationOutput)) {
    return {
      ok: true,
      incidentId,
      finalRecommendation: (incident as any).finalRecommendation,
      validationOutput: (incident as any).validationOutput,
    };
  }

  const evidenceText = buildEvidenceText(incident);
  if (!evidenceText) {
    return { ok: false, incidentId, status: 'failed', message: 'No evidenceText available for analysis' };
  }

  // Agent 1 + Agent 2 in parallel (each writes only to its own namespace).
  const [g1, g2] = await Promise.all([
    incidentsService.markAgentRunning(incidentId, 'agent1'),
    incidentsService.markAgentRunning(incidentId, 'agent2'),
  ]);

  if (!g1.ok && g1.reason === 'invalid_id') return { ok: false, incidentId, status: 'invalid_id', message: 'Invalid id' };
  if (!g2.ok && g2.reason === 'invalid_id') return { ok: false, incidentId, status: 'invalid_id', message: 'Invalid id' };

  // If either agent is already running, we treat the incident analysis as in-progress.
  if ((!g1.ok && g1.reason === 'already_running') || (!g2.ok && g2.reason === 'already_running')) {
    return { ok: false, incidentId, status: 'running', message: 'Analysis already running' };
  }

  const [a1Result, a2Result] = await Promise.allSettled([runAgent1(evidenceText), runAgent2(evidenceText)]);

  if (a1Result.status === 'fulfilled') {
    await incidentsService.setAgentResult(incidentId, 'agent1', { status: 'complete', ...a1Result.value });
  } else {
    await incidentsService.setAgentResult(incidentId, 'agent1', { status: 'failed', error: String(a1Result.reason ?? 'Agent1 failed') });
  }

  if (a2Result.status === 'fulfilled') {
    await incidentsService.setAgentResult(incidentId, 'agent2', { status: 'complete', ...a2Result.value });
  } else {
    await incidentsService.setAgentResult(incidentId, 'agent2', { status: 'failed', error: String(a2Result.reason ?? 'Agent2 failed') });
  }

  const refreshed = await incidentsService.getIncidentById(incidentId);
  if (!refreshed) return { ok: false, incidentId, status: 'not_found', message: 'Incident not found after agent run' };

  const agent1 = (refreshed as any).agentOutputs?.agent1 as AgentOutput | undefined;
  const agent2 = (refreshed as any).agentOutputs?.agent2 as AgentOutput | undefined;
  if (!isComplete(agent1) || !isComplete(agent2)) {
    return { ok: false, incidentId, status: 'failed', message: 'Agent outputs missing or failed' };
  }

  // Reconciliation (single writer: reconcilerOutput + finalRecommendation)
  const grecon = await incidentsService.markReconcilerRunning(incidentId);
  if (!grecon.ok && grecon.reason === 'already_running') {
    return { ok: false, incidentId, status: 'running', message: 'Reconciliation already running' };
  }

  // At this point both outputs are complete, so the non-null assertion is safe.
  const recon = await Promise.resolve(runReconciler(agent1!, agent2!)).then(
    (v) => ({ ok: true as const, v }),
    (err) => ({ ok: false as const, err })
  );

  if (!recon.ok) {
    await incidentsService.setReconcilerResult(incidentId, { status: 'failed', error: String(recon.err ?? 'Reconciler failed') });
    return { ok: false, incidentId, status: 'failed', message: 'Reconciler failed' };
  }

  await incidentsService.setReconcilerResult(incidentId, { status: 'complete', ...recon.v });

  // Validation (single writer: validationOutput)
  const gval = await incidentsService.markValidatorRunning(incidentId);
  if (!gval.ok && gval.reason === 'already_running') {
    return { ok: false, incidentId, status: 'running', message: 'Validation already running' };
  }

  const afterRecon = await incidentsService.getIncidentById(incidentId);
  const finalRecommendation = String((afterRecon as any)?.finalRecommendation ?? '');

  const val = await Promise.resolve(runValidator(finalRecommendation)).then(
    (v) => ({ ok: true as const, v }),
    (err) => ({ ok: false as const, err })
  );

  if (!val.ok) {
    await incidentsService.setValidatorResult(incidentId, { status: 'failed', error: String(val.err ?? 'Validator failed') });
    return { ok: false, incidentId, status: 'failed', message: 'Validator failed' };
  }

  await incidentsService.setValidatorResult(incidentId, { status: 'complete', ...val.v });

  const done = await incidentsService.getIncidentById(incidentId);
  return {
    ok: true,
    incidentId,
    finalRecommendation: String((done as any)?.finalRecommendation ?? ''),
    validationOutput: (done as any)?.validationOutput,
  };
}

