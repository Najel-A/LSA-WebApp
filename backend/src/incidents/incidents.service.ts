import mongoose from 'mongoose';
import { AlertModel, type AgentOutput, type ReconcilerOutput, type ValidationOutput } from '../alerts/alerts.model';

export type GuardResult =
  | { ok: true }
  | { ok: false; reason: 'not_found' | 'already_running' | 'invalid_id' };

function toObjectId(id: string): mongoose.Types.ObjectId | null {
  if (!mongoose.isValidObjectId(id)) return null;
  return new mongoose.Types.ObjectId(id);
}

function now(): Date {
  return new Date();
}

/**
 * MongoDB updates are atomic at the document level.
 *
 * We avoid mutexes by making each agent write to a disjoint nested path:
 * - agent1 -> agentOutputs.agent1
 * - agent2 -> agentOutputs.agent2
 * - reconciler -> reconcilerOutput + finalRecommendation
 * - validator -> validationOutput
 *
 * Stronger locking is only needed if multiple workers can run the SAME agent
 * for the SAME incident at the same time (e.g. multiple orchestrators in parallel).
 * We add a lightweight "already running" guard via conditional updates.
 */
export const incidentsService = {
  async getIncidentById(incidentId: string) {
    const _id = toObjectId(incidentId);
    if (!_id) return null;
    return await AlertModel.findById(_id).lean();
  },

  async markAgentRunning(incidentId: string, agentKey: 'agent1' | 'agent2'): Promise<GuardResult> {
    const _id = toObjectId(incidentId);
    if (!_id) return { ok: false, reason: 'invalid_id' };

    const path = `agentOutputs.${agentKey}.status`;
    const startedAtPath = `agentOutputs.${agentKey}.startedAt`;
    const errorPath = `agentOutputs.${agentKey}.error`;

    const res = await AlertModel.updateOne(
      {
        _id,
        $or: [{ [path]: { $ne: 'running' } }, { [path]: { $exists: false } }],
      },
      {
        $set: {
          [path]: 'running',
          [startedAtPath]: now(),
          [errorPath]: '',
          rcaStatus: 'analyzing',
        },
        $setOnInsert: {},
      }
    );

    if (res.matchedCount === 0) return { ok: false, reason: 'not_found' };
    if (res.modifiedCount === 0) return { ok: false, reason: 'already_running' };
    return { ok: true };
  },

  async setAgentResult(
    incidentId: string,
    agentKey: 'agent1' | 'agent2',
    result: Omit<AgentOutput, 'status' | 'startedAt'> & { status: 'complete' | 'failed' }
  ): Promise<GuardResult> {
    const _id = toObjectId(incidentId);
    if (!_id) return { ok: false, reason: 'invalid_id' };

    const base = `agentOutputs.${agentKey}`;
    const res = await AlertModel.updateOne(
      { _id },
      {
        $set: {
          [`${base}.status`]: result.status,
          [`${base}.diagnosis`]: result.diagnosis ?? '',
          [`${base}.fixPlan`]: result.fixPlan ?? '',
          [`${base}.actions`]: result.actions ?? [],
          [`${base}.confidence`]: result.confidence ?? 0,
          [`${base}.evidenceUsed`]: result.evidenceUsed ?? [],
          [`${base}.completedAt`]: now(),
          [`${base}.error`]: result.error ?? '',
        },
      }
    );

    if (res.matchedCount === 0) return { ok: false, reason: 'not_found' };
    return { ok: true };
  },

  async markReconcilerRunning(incidentId: string): Promise<GuardResult> {
    const _id = toObjectId(incidentId);
    if (!_id) return { ok: false, reason: 'invalid_id' };

    const res = await AlertModel.updateOne(
      {
        _id,
        $or: [{ 'reconcilerOutput.status': { $ne: 'running' } }, { 'reconcilerOutput.status': { $exists: false } }],
      },
      {
        $set: {
          'reconcilerOutput.status': 'running',
          'reconcilerOutput.error': '',
        },
      }
    );

    if (res.matchedCount === 0) return { ok: false, reason: 'not_found' };
    if (res.modifiedCount === 0) return { ok: false, reason: 'already_running' };
    return { ok: true };
  },

  async setReconcilerResult(
    incidentId: string,
    result: Omit<ReconcilerOutput, 'status'> & { status: 'complete' | 'failed' }
  ): Promise<GuardResult> {
    const _id = toObjectId(incidentId);
    if (!_id) return { ok: false, reason: 'invalid_id' };

    const res = await AlertModel.updateOne(
      { _id },
      {
        $set: {
          'reconcilerOutput.status': result.status,
          'reconcilerOutput.selectedDiagnosis': result.selectedDiagnosis ?? '',
          'reconcilerOutput.selectedFixPlan': result.selectedFixPlan ?? '',
          'reconcilerOutput.comparisonNotes': result.comparisonNotes ?? '',
          'reconcilerOutput.confidence': result.confidence ?? 0,
          'reconcilerOutput.completedAt': now(),
          'reconcilerOutput.error': result.error ?? '',
          finalRecommendation: result.status === 'complete' ? `${result.selectedDiagnosis ?? ''}\n\n${result.selectedFixPlan ?? ''}`.trim() : '',
        },
      }
    );

    if (res.matchedCount === 0) return { ok: false, reason: 'not_found' };
    return { ok: true };
  },

  async markValidatorRunning(incidentId: string): Promise<GuardResult> {
    const _id = toObjectId(incidentId);
    if (!_id) return { ok: false, reason: 'invalid_id' };

    const res = await AlertModel.updateOne(
      {
        _id,
        $or: [{ 'validationOutput.status': { $ne: 'running' } }, { 'validationOutput.status': { $exists: false } }],
      },
      {
        $set: {
          'validationOutput.status': 'running',
          'validationOutput.error': '',
        },
      }
    );

    if (res.matchedCount === 0) return { ok: false, reason: 'not_found' };
    if (res.modifiedCount === 0) return { ok: false, reason: 'already_running' };
    return { ok: true };
  },

  async setValidatorResult(
    incidentId: string,
    result: Omit<ValidationOutput, 'status'> & { status: 'complete' | 'failed' }
  ): Promise<GuardResult> {
    const _id = toObjectId(incidentId);
    if (!_id) return { ok: false, reason: 'invalid_id' };

    const requiresHumanApproval = Boolean(result.requiresHumanApproval);
    const isValid = Boolean(result.isValid);
    const rcaStatus =
      result.status !== 'complete' ? 'needs_review' : requiresHumanApproval || !isValid ? 'needs_review' : 'validated';

    const res = await AlertModel.updateOne(
      { _id },
      {
        $set: {
          'validationOutput.status': result.status,
          'validationOutput.isValid': result.isValid ?? false,
          'validationOutput.riskLevel': result.riskLevel ?? 'low',
          'validationOutput.requiresHumanApproval': requiresHumanApproval,
          'validationOutput.validationNotes': result.validationNotes ?? '',
          'validationOutput.completedAt': now(),
          'validationOutput.error': result.error ?? '',
          rcaStatus,
          humanReview: requiresHumanApproval
            ? { required: true }
            : { required: false },
        },
      }
    );

    if (res.matchedCount === 0) return { ok: false, reason: 'not_found' };
    return { ok: true };
  },
};

