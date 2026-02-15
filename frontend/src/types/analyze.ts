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
}
