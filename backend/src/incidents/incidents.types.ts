import type { AgentOutput, AgentRunStatus, ReconcilerOutput, ValidationOutput } from '../alerts/alerts.model';

/**
 * In this codebase, "incidents" are stored in the existing `alerts` collection.
 * We treat the Alert document `_id` as the `incidentId` in APIs.
 */
export type IncidentId = string;

export type IncidentAnalysisState = {
  incidentId: IncidentId;
  evidenceText?: string;
  status?: string;
  agentOutputs?: {
    agent1?: AgentOutput;
    agent2?: AgentOutput;
  };
  reconcilerOutput?: ReconcilerOutput;
  validationOutput?: ValidationOutput;
  finalRecommendation?: string;
  humanReview?: unknown;
  createdAt?: string;
  updatedAt?: string;
};

export const AGENT_STATUSES: ReadonlyArray<AgentRunStatus> = ['pending', 'running', 'complete', 'failed'];

