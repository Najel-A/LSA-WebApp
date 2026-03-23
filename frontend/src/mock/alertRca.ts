import type { AlertRcaDetail } from '@/types/alerts';

const defaultDetail: AlertRcaDetail = {
  rootCause: {
    summary: 'Insufficient signal in the sample; manual triage recommended.',
    category: 'Unknown',
    confidence: 0.45,
  },
  recommendedFix: {
    steps: ['Gather more logs around the failure window.', 'Check recent deploys and config changes.'],
  },
  validation: {
    confidenceLevel: 'low',
    status: 'pending_validation',
  },
  aiSummary: 'Automated analysis could not produce a high-confidence hypothesis for this incident.',
  evidenceSnippets: [],
  reasoningBullets: ['Limited matching patterns in ingested events.'],
  modelsUsed: ['NexusTrace-RCA v2.1'],
  systemValidated: false,
  similarIncidents: [],
};

export const mockAlertRcaById: Record<string, AlertRcaDetail> = {
  'alert-1': {
    rootCause: {
      summary:
        'Application code accesses `config` before it is initialized—likely a race or missing bootstrap in the module graph.',
      category: 'Application error',
      confidence: 0.86,
    },
    recommendedFix: {
      steps: [
        'Locate the stack frame referencing `getConfig` / `config` in `utils.js` and `app.js`.',
        'Ensure config is loaded before any consumer runs (lazy init or top-level await).',
        'Add a null guard and structured error for faster detection.',
      ],
      command: 'grep -R "getConfig\\|\\.config" src/ --include="*.js"',
    },
    validation: {
      confidenceLevel: 'high',
      status: 'validated_by_system',
    },
    aiSummary:
      'Repeated TypeErrors cluster on the same code path in production. Pattern matches uninitialized singleton config used during cold starts.',
    evidenceSnippets: [
      { id: 'e1', text: 'TypeError: Cannot read property "config" of undefined at Module.run (app.js:42)', source: 'stderr' },
      { id: 'e2', text: 'at Object.getConfig (utils.js:102)', source: 'stack' },
    ],
    reasoningBullets: [
      'Stack traces consistently point to `getConfig` before `initConfig` completes.',
      'Spike correlates with pod rollout timestamps, not infra events.',
      'No Redis or DB errors in the same window.',
    ],
    modelsUsed: ['NexusTrace-RCA v2.1', 'embedding-retrieval@prod'],
    systemValidated: true,
    similarIncidents: [
      {
        id: 'alert-3',
        title: 'DeprecationWarning: Buffer() is deprecated',
        diagnosis: 'Legacy Node API usage after dependency bump',
        status: 'resolved',
        confidence: 'medium',
      },
      {
        id: 'alert-2',
        title: 'Unhandled promise rejection in async handler',
        diagnosis: 'Downstream timeout causing unhandled rejections',
        status: 'active',
        confidence: 'high',
      },
    ],
  },
  'alert-2': {
    rootCause: {
      summary: 'Async handler rejects without a catch; upstream dependency likely timing out under load.',
      category: 'Dependency / timeout',
      confidence: 0.72,
    },
    recommendedFix: {
      steps: [
        'Add `.catch()` or try/fetch in `fetchData` (api.js:77).',
        'Increase client timeout or add circuit breaker for the failing service.',
        'Verify target service SLOs and error rates in the same window.',
      ],
    },
    validation: {
      confidenceLevel: 'medium',
      status: 'needs_review',
    },
    aiSummary:
      'Unhandled rejections align with connection timeout messages. Confidence is medium until dependency health is confirmed.',
    evidenceSnippets: [
      { id: 'e1', text: 'UnhandledPromiseRejectionWarning: Error: Connection timeout', source: 'runtime' },
    ],
    reasoningBullets: [
      'No OOM or image pull signals in correlated events.',
      'Pattern matches historical incidents tied to API gateway latency.',
    ],
    modelsUsed: ['NexusTrace-RCA v2.1'],
    systemValidated: false,
    similarIncidents: [
      {
        id: 'alert-4',
        title: 'ECONNREFUSED connecting to Redis',
        diagnosis: 'Backing service unreachable from app tier',
        status: 'active',
        confidence: 'medium',
      },
    ],
  },
  'alert-3': {
    rootCause: {
      summary: 'Node.js deprecation: `Buffer()` constructor flagged; migrate to `Buffer.alloc` / `Buffer.from`.',
      category: 'Deprecation / hygiene',
      confidence: 0.91,
    },
    recommendedFix: {
      steps: ['Replace `new Buffer(n)` with `Buffer.alloc(n)` or `Buffer.from(data)`.', 'Run codemod or eslint rule `no-buffer-constructor`.'],
      command: 'npx eslint --rule "node/no-deprecated-api: error" src/',
    },
    validation: {
      confidenceLevel: 'high',
      status: 'validated_by_system',
    },
    aiSummary: 'Low-severity, well-understood deprecation noise. Safe to batch-fix in a maintenance window.',
    evidenceSnippets: [
      { id: 'e1', text: 'DeprecationWarning: Buffer() is deprecated, use Buffer.alloc()', source: 'stderr' },
    ],
    reasoningBullets: ['Matches known Node deprecation signature.', 'No crash or error severity in the same lines.'],
    modelsUsed: ['NexusTrace-RCA v2.1'],
    systemValidated: true,
    similarIncidents: [
      {
        id: 'alert-1',
        title: 'TypeError: Cannot read property "config" of undefined',
        diagnosis: 'Uninitialized config access in app bootstrap',
        status: 'active',
        confidence: 'high',
      },
    ],
  },
  'alert-4': {
    rootCause: {
      summary: 'Application cannot reach Redis at the configured host/port—service down, wrong endpoint, or network policy.',
      category: 'Infrastructure / connectivity',
      confidence: 0.78,
    },
    recommendedFix: {
      steps: [
        'Verify Redis pod/service and DNS from the app namespace.',
        'Check security groups / network policies and connection string in secrets.',
        'Validate max connections and eviction policy if intermittent.',
      ],
      command: 'kubectl exec deploy/app -- redis-cli -h $REDIS_HOST ping',
    },
    validation: {
      confidenceLevel: 'medium',
      status: 'needs_review',
    },
    aiSummary: 'ECONNREFUSED is definitive for TCP refusal; root cause split between wrong address vs Redis not listening.',
    evidenceSnippets: [
      { id: 'e1', text: 'Redis connection refused at 127.0.0.1:6379', source: 'app log' },
      { id: 'e2', text: 'Retry attempt 3 failed', source: 'app log' },
    ],
    reasoningBullets: ['No application stack trace beyond connection layer.', 'Retries indicate transient or wrong target.'],
    modelsUsed: ['NexusTrace-RCA v2.1', 'infra-pattern-matcher'],
    systemValidated: false,
    similarIncidents: [
      {
        id: 'alert-2',
        title: 'Unhandled promise rejection in async handler',
        diagnosis: 'Downstream dependency failure',
        status: 'active',
        confidence: 'medium',
      },
    ],
  },
  'alert-5': {
    rootCause: {
      summary: 'Expensive unbounded query on `users` table—likely missing index or N+1 access pattern.',
      category: 'Database performance',
      confidence: 0.68,
    },
    recommendedFix: {
      steps: [
        'Add EXPLAIN on the query; add covering index on filter/join columns.',
        'Paginate or limit `SELECT *` from hot paths.',
      ],
    },
    validation: {
      confidenceLevel: 'low',
      status: 'pending_validation',
    },
    aiSummary: 'Slow query alert only; need query plan and row counts to raise confidence.',
    evidenceSnippets: [{ id: 'e1', text: 'Slow query detected (>2s): SELECT * FROM users', source: 'APM' }],
    reasoningBullets: ['Signal is generic; multiple causes possible (lock, IO, missing index).'],
    modelsUsed: ['NexusTrace-RCA v2.1'],
    systemValidated: false,
    similarIncidents: [],
  },
};

export function getAlertRcaDetail(alertId: string): AlertRcaDetail {
  return mockAlertRcaById[alertId] ?? { ...defaultDetail, similarIncidents: [] };
}
