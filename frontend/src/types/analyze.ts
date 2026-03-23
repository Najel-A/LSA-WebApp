import type { ValidationState } from './alerts';

export interface AnomalyItem {
  id: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  lineRef?: string;
  confidence: number; // 0–1
}

export interface RcaGuess {
  id: string;
  description: string;
  confidence: number; // 0–1
  relatedAnomalyIds?: string[];
}

export interface RecommendedFix {
  id: string;
  title: string;
  description: string;
  confidence: number; // 0–1
}

export interface AnalysisResult {
  modelVersion: string;
  overallConfidence: number; // 0–1
  anomalies: AnomalyItem[];
  rcaGuesses: RcaGuess[];
  recommendedFixes: RecommendedFix[];
  /** Aligns with alert detail RCA workspace */
  predictedRootCause: {
    summary: string;
    category: string;
    confidence: number;
  };
  primaryRecommendedFix: {
    steps: string[];
    command?: string;
  };
  validationStatus: ValidationState;
  confidenceBand: 'low' | 'medium' | 'high';
  evidenceSnippets: { id: string; text: string; source?: string }[];
  reasoningBullets: string[];
  modelsUsed: string[];
  systemValidated: boolean;
}
