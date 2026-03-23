import type { RcaConfidenceBand, RcaStatus, ValidationState } from './alerts';

/**
 * Frontend shape for evidence-driven K8s incident analysis.
 * Designed to align with backend + FastAPI; mock fills fields until API wired everywhere.
 */
export interface IncidentAnalysisPayload {
  alertId: string;
  evidenceText: string;
  /** Filled after model / parser run */
  diagnosis: string;
  fixPlan: string;
  actions: string;
  verification: string;
  rollback: string;
  confidence: RcaConfidenceBand;
  rcaStatus: RcaStatus;
  validationStatus: ValidationState;
}

export interface NexusAnalyzeRequestBody {
  system_prompt: string;
  prompt: string;
  max_new_tokens: number;
  max_time: number;
  temperature: number;
  top_p: number;
}

/** Parsed sections from free-text model output */
export interface ParsedRcaSections {
  diagnosis: string;
  fixPlan: string;
  actions: string;
  verification: string;
  rollback: string;
}
