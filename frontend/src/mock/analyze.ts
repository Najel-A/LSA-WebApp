import type { AnalysisResult } from '@/types/analyze';

/** Mock analysis: parses log text and returns a fixed structure. No backend. */
export function runMockAnalysis(logText: string): AnalysisResult {
  const lines = logText.trim().split(/\n/).filter(Boolean);
  const hasError = /error|exception|fail|timeout/i.test(logText);
  const hasWarn = /warn|deprecat/i.test(logText);

  const anomalies = [
    ...(hasError
      ? [
          {
            id: 'an-1',
            message: 'Error-level log entries detected',
            severity: 'high' as const,
            lineRef: lines[0]?.slice(0, 40),
            confidence: 0.92,
          },
        ]
      : []),
    ...(lines.length > 500
      ? [
          {
            id: 'an-2',
            message: 'Unusually high log volume may indicate a loop or leak',
            severity: 'medium' as const,
            confidence: 0.78,
          },
        ]
      : []),
    ...(hasWarn
      ? [
          {
            id: 'an-3',
            message: 'Deprecation or warning patterns present',
            severity: 'low' as const,
            confidence: 0.65,
          },
        ]
      : []),
  ].filter(Boolean);

  if (anomalies.length === 0) {
    anomalies.push({
      id: 'an-0',
      message: 'No significant anomalies detected in the sample',
      severity: 'low',
      confidence: 0.88,
    });
  }

  const rcaGuesses = [
    {
      id: 'rca-1',
      description: hasError
        ? 'Probable application or runtime error; check stack traces and recent deployments.'
        : 'Log pattern suggests configuration or environment drift.',
      confidence: hasError ? 0.85 : 0.62,
      relatedAnomalyIds: ['an-1'],
    },
    {
      id: 'rca-2',
      description: 'Resource exhaustion (CPU/memory) or external dependency timeout.',
      confidence: 0.58,
    },
  ];

  const recommendedFixes = [
    {
      id: 'fix-1',
      title: 'Inspect stack traces',
      description: 'Search for "Error" or "Exception" and correlate with deployment time.',
      confidence: 0.9,
    },
    {
      id: 'fix-2',
      title: 'Check dependency health',
      description: 'Verify downstream services and retry/backoff configuration.',
      confidence: 0.75,
    },
    {
      id: 'fix-3',
      title: 'Review recent changes',
      description: 'Compare log timestamps with recent config or code deployments.',
      confidence: 0.7,
    },
  ];

  const overallConfidence =
    anomalies.length > 0
      ? anomalies.reduce((s, a) => s + a.confidence, 0) / anomalies.length
      : 0.5;

  return {
    modelVersion: 'v2.1.0',
    overallConfidence: Math.round(overallConfidence * 100) / 100,
    anomalies: anomalies as AnalysisResult['anomalies'],
    rcaGuesses: rcaGuesses as AnalysisResult['rcaGuesses'],
    recommendedFixes: recommendedFixes as AnalysisResult['recommendedFixes'],
  };
}
