import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { mockAlerts, mockAlertEvents } from '@/mock/alerts';
import { getAlertRcaDetail } from '@/mock/alertRca';
import { buildMockIncidentEvidence } from '@/mock/incidentEvidence';
import {
  DEFAULT_K8S_SYSTEM_PROMPT,
  buildEvidencePrompt,
  formatNexusAnalyzeError,
  isNexusAbortError,
  postNexusAnalyze,
  resolveNexusAnalyzeTimeoutMs,
} from '@/services/nexusAnalyzeApi';
import { parseRcaResponse } from '@/lib/parseRcaResponse';
import type { ParsedRcaSections } from '@/types/incidentAnalysis';
import type { ValidationState } from '@/types/alerts';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { WatchToggle } from '@/components/dashboard/WatchToggle';
import { AlertFeedbackForm } from '@/components/dashboard/AlertFeedbackForm';
import { RcaWorkspaceSections } from '@/components/dashboard/RcaWorkspaceSections';
import type { AlertSeverity } from '@/types/alerts';

function formatLastSeen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

const severityBadge: Record<AlertSeverity, string> = {
  critical: 'bg-red-100 text-red-800',
  error: 'bg-orange-100 text-orange-800',
  warning: 'bg-amber-100 text-amber-800',
  info: 'bg-neutral-100 text-neutral-700',
  debug: 'bg-neutral-50 text-neutral-500',
};

const rcaStatusStyles = {
  pending: 'bg-neutral-100 text-neutral-600',
  analyzing: 'bg-primary-100 text-primary-800',
  validated: 'bg-emerald-100 text-emerald-800',
  needs_review: 'bg-amber-100 text-amber-800',
} as const;

const rcaStatusLabel = {
  pending: 'Pending',
  analyzing: 'Analyzing',
  validated: 'Validated',
  needs_review: 'Review',
} as const;

function validationLabel(s: ValidationState): string {
  switch (s) {
    case 'validated_by_system':
      return 'Validated by system';
    case 'needs_review':
      return 'Needs review';
    case 'pending_validation':
      return 'Pending validation';
    default:
      return s;
  }
}

const EMPTY_PARSED: ParsedRcaSections = {
  diagnosis: '',
  fixPlan: '',
  actions: '',
  verification: '',
  rollback: '',
};

/** Stable shape for client timeout hint (only max_time affects resolveNexusAnalyzeTimeoutMs). */
const ANALYSIS_TIMEOUT_HINT_BODY = {
  system_prompt: DEFAULT_K8S_SYSTEM_PROMPT,
  prompt: '',
  max_new_tokens: 1024,
  max_time: 120,
  temperature: 0,
  top_p: 1,
} as const;

export function AlertDetailPage() {
  const { id } = useParams<{ id: string }>();
  const alert = id ? mockAlerts.find((a) => a.id === id) : null;
  const events = useMemo(
    () => (id ? mockAlertEvents.filter((e) => e.alertId === id) : []),
    [id]
  );
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const [phase, setPhase] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [rawResponse, setRawResponse] = useState('');
  const [parsed, setParsed] = useState<ParsedRcaSections>(EMPTY_PARSED);
  const [parseOk, setParseOk] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<ValidationState>('pending_validation');

  const analysisAbortRef = useRef<AbortController | null>(null);

  const clientTimeoutMinutes = useMemo(
    () => Math.ceil(resolveNexusAnalyzeTimeoutMs(ANALYSIS_TIMEOUT_HINT_BODY) / 60000),
    []
  );

  const runAnalysis = useCallback(async () => {
    if (!alert) return;
    analysisAbortRef.current?.abort();
    const ac = new AbortController();
    analysisAbortRef.current = ac;

    setPhase('loading');
    setAnalysisError(null);
    setRawResponse('');
    setParsed(EMPTY_PARSED);
    setParseOk(false);
    setValidationStatus('pending_validation');

    const evidenceText = buildMockIncidentEvidence(alert, events);
    const prompt = buildEvidencePrompt(evidenceText);

    const body = {
      system_prompt: DEFAULT_K8S_SYSTEM_PROMPT,
      prompt,
      max_new_tokens: 1024,
      max_time: 120,
      temperature: 0,
      top_p: 1,
    };

    try {
      const raw = await postNexusAnalyze(body, { signal: ac.signal });
      if (ac.signal.aborted) return;
      setRawResponse(raw);
      const { sections, parseOk: ok } = parseRcaResponse(raw);
      setParsed(sections);
      setParseOk(ok);
      setValidationStatus(ok ? 'needs_review' : 'pending_validation');
      setPhase('success');
    } catch (e) {
      if (isNexusAbortError(e)) return;
      setAnalysisError(formatNexusAnalyzeError(e));
      setPhase('error');
    }
  }, [alert, events]);

  useEffect(() => {
    if (alert) {
      void runAnalysis();
    }
    return () => {
      analysisAbortRef.current?.abort();
    };
  }, [alert?.id, runAnalysis]);

  if (!id || !alert) {
    return (
      <div className="space-y-4">
        <Card className="max-w-md mx-auto text-center py-12">
          <p className="text-neutral-600 mb-4">Alert not found.</p>
          <Link to="/dashboard">
            <Button variant="secondary">Back to Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const rcaMeta = getAlertRcaDetail(alert.id);
  const similar = rcaMeta.similarIncidents.filter((s) => s.id !== alert.id);

  const headerRcaStatus =
    phase === 'loading' ? 'analyzing' : phase === 'error' ? alert.rcaStatus : phase === 'success' ? 'needs_review' : alert.rcaStatus;

  const evidenceText = buildMockIncidentEvidence(alert, events);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <Link
          to="/dashboard"
          className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline inline-flex items-center gap-1"
        >
          ← Back to incidents
        </Link>
      </div>

      {/* Top: title + meta + RCA signals + watch */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl leading-tight">{alert.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusPill status={alert.status} />
            <span
              className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full capitalize ${severityBadge[alert.severity]}`}
            >
              {alert.severity}
            </span>
            <span className="text-sm text-neutral-500">{alert.environment}</span>
            <span className="text-sm text-neutral-500">Last seen: {formatLastSeen(alert.lastSeen)}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex px-2 py-0.5 text-xs font-semibold uppercase tracking-wide rounded-md ${rcaStatusStyles[headerRcaStatus]}`}
            >
              RCA: {rcaStatusLabel[headerRcaStatus]}
            </span>
            <span className="text-xs text-neutral-500 capitalize">
              Triage confidence: <strong className="text-neutral-700">{alert.rcaConfidence}</strong>
            </span>
            <span className="text-xs text-neutral-500">
              Validation: <strong className="text-neutral-700">{validationLabel(validationStatus)}</strong>
            </span>
            {phase === 'error' && (
              <span className="text-xs text-red-600 font-medium">Analysis unavailable — check FastAPI on :8000</span>
            )}
          </div>
        </div>
        <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button variant="secondary" className="!text-sm" onClick={() => void runAnalysis()} disabled={phase === 'loading'}>
            {phase === 'loading' ? 'Analyzing…' : 'Re-run analysis'}
          </Button>
          <WatchToggle alertId={alert.id} />
        </div>
      </div>

      {/* Main RCA (from FastAPI + parser) */}
      {phase === 'loading' && (
        <Card>
          <p className="text-sm text-neutral-600">Sending incident evidence to the analyzer…</p>
          <p className="text-xs text-neutral-500 mt-2">
            Model inference can take several minutes. This request will wait up to ~{clientTimeoutMinutes} min before
            timing out (see <code className="text-xs">VITE_NEXUSTRACE_ANALYZE_TIMEOUT_MS</code> to override).
          </p>
        </Card>
      )}

      {phase === 'error' && analysisError && (
        <Card className="border-red-200 bg-red-50/50">
          <h2 className="text-sm font-semibold text-red-800 mb-2">Could not reach analyzer</h2>
          <p className="text-sm text-red-700 mb-3">{analysisError}</p>
          <Button onClick={() => void runAnalysis()}>Retry</Button>
        </Card>
      )}

      {phase === 'success' && (
        <RcaWorkspaceSections sections={parsed} parseOk={parseOk} rawResponse={rawResponse} />
      )}

      {/* Supporting */}
      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-3">
            Recent events
          </h2>
          {sortedEvents.length === 0 ? (
            <p className="text-sm text-neutral-500">No recent events.</p>
          ) : (
            <ul className="space-y-2 divide-y divide-neutral-100">
              {sortedEvents.slice(0, 10).map((ev) => (
                <li key={ev.id} className="pt-2 first:pt-0">
                  <p className="text-sm text-neutral-900 font-mono truncate" title={ev.message}>
                    {ev.message}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {formatTime(ev.timestamp)}
                    {ev.level && ` · ${ev.level}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-3">
            Raw incident evidence
          </h2>
          <p className="text-xs text-neutral-500 mb-2">
            Bundle sent to the model (mock; later from ingestion API).
          </p>
          <pre className="text-xs font-mono bg-neutral-50 border border-neutral-200 rounded-md p-3 max-h-80 overflow-auto text-neutral-800 whitespace-pre-wrap">
            {evidenceText}
          </pre>
        </Card>
      </div>

      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-3">
          Timeline
        </h2>
        {sortedEvents.length === 0 ? (
          <p className="text-sm text-neutral-500">No timeline events.</p>
        ) : (
          <ul className="relative space-y-4">
            {sortedEvents.map((ev, i) => (
              <li key={ev.id} className="relative flex gap-4">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-3 h-3 rounded-full bg-primary-500" />
                  {i < sortedEvents.length - 1 && (
                    <div className="w-0.5 flex-1 min-h-[1rem] bg-neutral-200 my-1" />
                  )}
                </div>
                <div className="pb-4 min-w-0">
                  <p className="text-xs font-medium text-neutral-500">{formatLastSeen(ev.timestamp)}</p>
                  <p className="text-sm text-neutral-700 mt-0.5 truncate" title={ev.message}>
                    {ev.message}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {similar.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-3">
            Similar incidents
          </h2>
          <p className="text-xs text-neutral-500 mb-4">Historical triage (mock).</p>
          <ul className="divide-y divide-neutral-100">
            {similar.map((s) => (
              <li key={s.id} className="py-3 first:pt-0 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-900 truncate">{s.title}</p>
                  <p className="text-xs text-neutral-600 mt-0.5 line-clamp-2">{s.diagnosis}</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs">
                    <StatusPill status={s.status} />
                    <span className="text-neutral-500 capitalize">{s.confidence} confidence</span>
                  </div>
                </div>
                <Link to={`/alerts/${s.id}`}>
                  <Button variant="secondary" className="!py-1.5 !px-3 !text-xs shrink-0">
                    View
                  </Button>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <AlertFeedbackForm
        alertId={alert.id}
        alertTitle={alert.title}
        isTriaged={alert.rcaStatus === 'needs_review' || alert.rcaStatus === 'validated'}
      />
    </div>
  );
}
