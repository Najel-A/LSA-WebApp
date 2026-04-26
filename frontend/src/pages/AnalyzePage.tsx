import { useState, useCallback, useMemo, useRef, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
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
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RcaWorkspaceSections } from '@/components/dashboard/RcaWorkspaceSections';

const EMPTY_PARSED: ParsedRcaSections = {
  diagnosis: '',
  fixPlan: '',
  actions: '',
  verification: '',
  rollback: '',
};

function defaultSandboxEvidence(): string {
  return `## Context
- Namespace: prod
- Workload: deployment/launchpad-api
- Pod: launchpad-api-7d9f8c6b4-xk2zq
- Container: api
- Image: registry.internal/launchpad/api:v1.4.2
- Incident title: Example incident evidence
- Severity: error
- Environment label: production

## kubectl get pods -n prod -l app=launchpad-api
NAME                          READY   STATUS             RESTARTS   AGE
launchpad-api-7d9f8c6b4-xk2zq  0/1     CrashLoopBackOff   12         45m

## Container logs (api)
TypeError: Cannot read property "config" of undefined at Module.run (app.js:42)
at Object.getConfig (utils.js:102)
`;
}

const ANALYSIS_TIMEOUT_HINT_BODY = {
  system_prompt: DEFAULT_K8S_SYSTEM_PROMPT,
  prompt: '',
  max_new_tokens: 1024,
  max_time: 120,
  temperature: 0,
  top_p: 1,
} as const;

export function AnalyzePage() {
  const [evidenceInput, setEvidenceInput] = useState(defaultSandboxEvidence);
  const [phase, setPhase] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [rawResponse, setRawResponse] = useState('');
  const [parsed, setParsed] = useState<ParsedRcaSections>(EMPTY_PARSED);
  const [parseOk, setParseOk] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const analysisAbortRef = useRef<AbortController | null>(null);

  const clientTimeoutMinutes = useMemo(
    () => Math.ceil(resolveNexusAnalyzeTimeoutMs(ANALYSIS_TIMEOUT_HINT_BODY) / 60000),
    []
  );

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File too large. Max 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setEvidenceInput(String(reader.result ?? ''));
    };
    reader.onerror = () => setUploadError('Failed to read file.');
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  const runAnalysis = useCallback(async () => {
    const text = evidenceInput.trim() || 'No evidence provided.';
    analysisAbortRef.current?.abort();
    const ac = new AbortController();
    analysisAbortRef.current = ac;

    setPhase('loading');
    setAnalysisError(null);
    setRawResponse('');
    setParsed(EMPTY_PARSED);
    setParseOk(false);

    const prompt = buildEvidencePrompt(text);
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
      setPhase('success');
    } catch (e) {
      if (isNexusAbortError(e)) return;
      setAnalysisError(formatNexusAnalyzeError(e));
      setPhase('error');
    }
  }, [evidenceInput]);

  const statusLine = useMemo(() => {
    if (phase === 'idle') return null;
    if (phase === 'loading') return 'Calling local FastAPI…';
    if (phase === 'error') return 'Request failed';
    return parseOk ? 'Sections parsed' : 'Partial / unparsed output';
  }, [phase, parseOk]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/dashboard"
            className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
          >
            ← Incidents
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900 mt-1">RCA sandbox</h1>
          <p className="text-sm text-neutral-500 mt-1 max-w-xl">
            Secondary testing: paste incident evidence (kubectl, events, logs) and hit the same analyzer as incident
            detail. Primary flow remains dashboard → incident.
          </p>
        </div>
      </div>

      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-3">
          Incident evidence
        </h2>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 cursor-pointer focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-1">
              Load from file
              <input
                type="file"
                accept=".log,.txt,.json,.csv,text/plain,application/json"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
            {uploadError && (
              <span role="alert" className="text-sm text-red-600">
                {uploadError}
              </span>
            )}
          </div>
          <textarea
            value={evidenceInput}
            onChange={(e) => setEvidenceInput(e.target.value)}
            placeholder="Namespace, workload, kubectl get/describe/events, container logs, metrics snapshot…"
            rows={14}
            className="block w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <Button onClick={() => void runAnalysis()} disabled={phase === 'loading'}>
            {phase === 'loading' ? 'Analyzing…' : 'Run analysis'}
          </Button>
        </div>
      </Card>

      {phase === 'loading' && (
        <Card>
          <p className="text-sm text-neutral-600">POST /query → local FastAPI (model inference in progress)…</p>
          <p className="text-xs text-neutral-500 mt-2">
            Waits up to ~{clientTimeoutMinutes} min before client timeout. Override with{' '}
            <code className="text-xs">VITE_NEXUSTRACE_ANALYZE_TIMEOUT_MS</code>.
          </p>
        </Card>
      )}

      {phase === 'error' && analysisError && !rawResponse && (
        <Card className="border-red-200 bg-red-50/50">
          <h2 className="text-sm font-semibold text-red-800 mb-2">Analyzer error</h2>
          <p className="text-sm text-red-700 mb-3">{analysisError}</p>
          <Button onClick={() => void runAnalysis()}>Retry</Button>
        </Card>
      )}

      {phase === 'success' && rawResponse && (
        <div className="space-y-4">
          {statusLine && (
            <p className="text-xs text-neutral-500">
              <span className="font-medium text-neutral-700">{statusLine}</span>
            </p>
          )}
          <RcaWorkspaceSections sections={parsed} parseOk={parseOk} rawResponse={rawResponse} />
        </div>
      )}
    </div>
  );
}
