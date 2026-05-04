export type AlertSeverity = 'critical' | 'error' | 'warning' | 'info' | 'debug';
export type AlertStatus = 'active' | 'resolved' | 'muted';

/** Dashboard row: lightweight RCA signal for triage */
export type RcaStatus = 'pending' | 'analyzing' | 'validated' | 'needs_review';
export type RcaConfidenceBand = 'low' | 'medium' | 'high';

export interface AlertItem {
  id: string;
  title: string;
  severity: AlertSeverity;
  status: AlertStatus;
  environment: string;
  project: string;
  total: number;
  lastSeen: string; // ISO date string
  trend: number[]; // sparkline values (e.g. last 24h buckets)
  ips?: number;
  people?: number;
  rcaStatus: RcaStatus;
  rcaConfidence: RcaConfidenceBand;
  evidenceText?: string;
}

export interface AlertEvent {
  id: string;
  alertId: string;
  message: string;
  timestamp: string; // ISO date string
  level?: string;
}

export type TimeRangeKey = '1h' | '24h' | '7d';

/** User feedback tied to system diagnosis (stored in localStorage) */
export interface AlertFeedback {
  diagnosisCorrect: 'yes' | 'no' | null;
  fixUseful: 'yes' | 'no' | null;
  actualRootCause: string;
  fixWorked: string;
  notes: string;
  updatedAt: string; // ISO
}

export interface SimilarIncident {
  id: string;
  title: string;
  diagnosis: string;
  status: AlertStatus;
  confidence: RcaConfidenceBand;
}

export interface EvidenceSnippet {
  id: string;
  text: string;
  source?: string;
}

export type ValidationState = 'validated_by_system' | 'needs_review' | 'pending_validation';

export interface AlertRcaDetail {
  rootCause: {
    summary: string;
    category: string;
    confidence: number; // 0–1
  };
  recommendedFix: {
    steps: string[];
    command?: string;
  };
  validation: {
    confidenceLevel: RcaConfidenceBand;
    status: ValidationState;
  };
  aiSummary: string;
  evidenceSnippets: EvidenceSnippet[];
  reasoningBullets: string[];
  modelsUsed: string[];
  systemValidated: boolean;
  similarIncidents: SimilarIncident[];
}
