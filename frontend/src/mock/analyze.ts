import type { AnalysisResult } from '@/types/analyze';
import type { ValidationState } from '@/types/alerts';

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

  const confidenceBand: AnalysisResult['confidenceBand'] =
    overallConfidence >= 0.8 ? 'high' : overallConfidence >= 0.6 ? 'medium' : 'low';

  const validationStatus: ValidationState = hasError
    ? 'needs_review'
    : overallConfidence >= 0.75
      ? 'validated_by_system'
      : 'pending_validation';

  const predictedRootCause = {
    summary: hasError
      ? 'Application or runtime error pattern detected in the log sample.'
      : 'No strong error signature; possible configuration or environment drift.',
    category: hasError ? 'Application error' : 'Operational',
    confidence: hasError ? 0.82 : 0.55,
  };

  const primaryRecommendedFix = {
    steps: [
      'Correlate timestamps with the last deployment or config change.',
      'Open the first stack frame in your repo and add defensive checks or logging.',
    ],
    command: hasError ? 'grep -n "Error\\|Exception" your.log | head -20' : undefined,
  };

  const evidenceSnippets = [
    {
      id: 'ev-1',
      text: lines[0]?.slice(0, 120) || '(empty first line)',
      source: 'log',
    },
    ...(lines[1]
      ? [{ id: 'ev-2', text: lines[1].slice(0, 120), source: 'log' as const }]
      : []),
  ];

  const reasoningBullets = [
    hasError
      ? 'Error-level tokens and stack-like lines increase likelihood of a code defect.'
      : 'Sample lacks decisive infra or dependency failure markers.',
    lines.length > 100 ? 'Large sample size improves statistical confidence.' : 'Small sample; treat as directional only.',
  ];

  return {
    modelVersion: 'v2.1.0',
    overallConfidence: Math.round(overallConfidence * 100) / 100,
    anomalies: anomalies as AnalysisResult['anomalies'],
    rcaGuesses: rcaGuesses as AnalysisResult['rcaGuesses'],
    recommendedFixes: recommendedFixes as AnalysisResult['recommendedFixes'],
    predictedRootCause,
    primaryRecommendedFix,
    validationStatus,
    confidenceBand,
    evidenceSnippets,
    reasoningBullets,
    modelsUsed: ['NexusTrace-RCA v2.1', 'log-signal-classifier'],
    systemValidated: validationStatus === 'validated_by_system',
  };
}
