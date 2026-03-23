import type { AlertEvent, AlertItem } from '@/types/alerts';

/**
 * Mock incident evidence block (namespace, kubectl, events, logs).
 * Replace with API-sourced bundle when backend exists.
 */
export function buildMockIncidentEvidence(alert: AlertItem, events: AlertEvent[]): string {
  const ns = alert.environment === 'production' ? 'prod' : alert.environment === 'staging' ? 'staging' : 'dev';
  const workload = 'deployment/launchpad-api';
  const pod = `launchpad-api-7d9f8c6b4-xk2zq`;
  const container = 'api';
  const image = 'registry.internal/launchpad/api:v1.4.2';

  const logLines = events
    .slice(0, 6)
    .map((e) => e.message)
    .join('\n');

  return `## Context
- Namespace: ${ns}
- Workload: ${workload}
- Pod: ${pod}
- Container: ${container}
- Image: ${image}
- Incident title: ${alert.title}
- Severity: ${alert.severity}
- Environment label: ${alert.environment}

## kubectl get pods -n ${ns} -l app=launchpad-api
NAME                          READY   STATUS             RESTARTS   AGE
${pod}           0/1     CrashLoopBackOff   12         45m
launchpad-api-7d9f8c6b4-abc12 1/1     Running            0          2d

## kubectl describe pod ${pod} -n ${ns}
Name:             ${pod}
Namespace:        ${ns}
Status:           Running
Containers:
  ${container}:
    State:          Waiting
      Reason:       CrashLoopBackOff
    Last State:     Terminated
      Reason:       Error
      Exit Code:    1
    Ready:          False
    Restart Count:  12
Conditions:
  Type              Status
  Ready             False
  ContainersReady   False

## kubectl get events -n ${ns} --sort-by='.lastTimestamp'
LAST SEEN   TYPE      REASON    OBJECT                        MESSAGE
2m          Warning   BackOff   pod/${pod}   Back-off restarting failed container ${container}
5m          Normal    Pulled    pod/${pod}   Successfully pulled image "${image}"
6m          Warning   Unhealthy pod/${pod}   Readiness probe failed

## Container logs (${container})
${logLines || '(no structured events in mock bundle)'}

## Metrics snapshot (mock)
- CPU throttling: none observed
- Memory: working set near limit (85% of limit) in prior window
`;
}
