import type { NexusAnalyzeRequestBody } from '@/types/incidentAnalysis';

/** Must match `server.proxy` in vite.config.ts and your FastAPI route (e.g. POST /query). */
const DEFAULT_ANALYZE_PATH = '/query';

/** Extra buffer beyond `body.max_time` (seconds) so the client outlives slow inference + network. */
const TIMEOUT_BUFFER_MS = 60_000;

/** Minimum client wait even if `max_time` is small (model cold start, queue, etc.). */
const MIN_TIMEOUT_MS = 120_000;

function analyzeUrl(): string {
  const base = import.meta.env.VITE_NEXUSTRACE_ANALYZE_URL as string | undefined;
  if (base) return base.replace(/\/$/, '');
  return DEFAULT_ANALYZE_PATH;
}

/** Client-side wall-clock timeout for the fetch (ms). Override with `VITE_NEXUSTRACE_ANALYZE_TIMEOUT_MS`. */
export function resolveNexusAnalyzeTimeoutMs(body: NexusAnalyzeRequestBody): number {
  const fromEnv = Number(import.meta.env.VITE_NEXUSTRACE_ANALYZE_TIMEOUT_MS);
  if (Number.isFinite(fromEnv) && fromEnv > 0) {
    return fromEnv;
  }
  const fromBody = body.max_time * 1000 + TIMEOUT_BUFFER_MS;
  return Math.max(fromBody, MIN_TIMEOUT_MS);
}

export interface PostNexusAnalyzeOptions {
  /** Abort to cancel (navigation away, new run, user cancel). */
  signal?: AbortSignal;
  /** Overrides `resolveNexusAnalyzeTimeoutMs(body)` when set. */
  timeoutMs?: number;
}

export function isNexusAbortError(e: unknown): boolean {
  return e instanceof DOMException && e.name === 'AbortError';
}

function assertNonEmptyAnalyzerText(text: string, context: string): void {
  if (typeof text !== 'string' || text.trim().length === 0) {
    throw new Error(
      `Invalid analyzer response (${context}): expected non-empty text. The server may have returned an empty body.`
    );
  }
}

/**
 * Map thrown values to UI-safe messages. Returns empty string for user-initiated abort (caller should ignore).
 */
export function formatNexusAnalyzeError(e: unknown): string {
  if (isNexusAbortError(e)) return '';
  if (e instanceof Error) {
    if (/timed out|Inference timed out/i.test(e.message)) {
      return e.message;
    }
  }
  if (e instanceof TypeError && /fetch|network|load failed/i.test(e.message)) {
    return 'Network error — check that the analyzer is running and reachable.';
  }
  if (e instanceof Error) return e.message;
  return 'Analysis request failed';
}

async function readResponseBodyAsText(res: Response): Promise<string> {
  const ct = res.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    const data = (await res.json()) as unknown;
    if (typeof data === 'string') {
      assertNonEmptyAnalyzerText(data, 'JSON string');
      return data;
    }
    if (data && typeof data === 'object') {
      const o = data as Record<string, unknown>;
      const t =
        o.text ??
        o.output ??
        o.response ??
        o.content ??
        o.message ??
        o.result;
      if (typeof t === 'string') {
        assertNonEmptyAnalyzerText(t, 'JSON field');
        return t;
      }
    }
    const fallback = JSON.stringify(data, null, 2);
    assertNonEmptyAnalyzerText(fallback, 'JSON stringified');
    return fallback;
  }

  const text = await res.text();
  assertNonEmptyAnalyzerText(text, 'plain text');
  return text;
}

export async function postNexusAnalyze(
  body: NexusAnalyzeRequestBody,
  options?: PostNexusAnalyzeOptions
): Promise<string> {
  const url = analyzeUrl();
  const timeoutMs = options?.timeoutMs ?? resolveNexusAnalyzeTimeoutMs(body);
  const userSignal = options?.signal;

  const controller = new AbortController();
  let timedOut = false;

  const onUserAbort = () => {
    if (!controller.signal.aborted) controller.abort();
  };
  if (userSignal) {
    if (userSignal.aborted) {
      onUserAbort();
    } else {
      userSignal.addEventListener('abort', onUserAbort, { once: true });
    }
  }

  const tid = globalThis.setTimeout(() => {
    timedOut = true;
    if (!controller.signal.aborted) controller.abort();
  }, timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      throw new Error(errText?.trim() || `Analyzer returned ${res.status} ${res.statusText}`);
    }

    const text = await readResponseBodyAsText(res);
    return text;
  } catch (e) {
    if (timedOut) {
      throw new Error(
        `Inference timed out after ${Math.round(timeoutMs / 1000)}s while waiting for the model. ` +
          'The server may still be running — try again, or set VITE_NEXUSTRACE_ANALYZE_TIMEOUT_MS to a higher value.'
      );
    }
    if (isNexusAbortError(e)) {
      throw e;
    }
    throw e instanceof Error ? e : new Error(String(e));
  } finally {
    globalThis.clearTimeout(tid);
    userSignal?.removeEventListener('abort', onUserAbort);
  }
}

export const DEFAULT_K8S_SYSTEM_PROMPT = `You are NexusTrace, an internal SRE assistant. Given Kubernetes incident evidence (namespace, workloads, kubectl output, events, logs), produce a structured analysis with these exact section headers (each on its own line, no markdown # required):

Diagnosis
Step-by-Step Fix Plan
Concrete Actions or Commands to Apply the Fix
Verification Steps to Confirm the Fix Worked
Rollback Guidance if the Fix Causes Issues

Be concise, actionable, and safe. Prefer kubectl commands where appropriate.`;

export function buildEvidencePrompt(evidenceText: string): string {
  return `Analyze the following Kubernetes incident evidence and respond using the required section headers.

--- INCIDENT EVIDENCE ---
${evidenceText.trim()}
--- END EVIDENCE ---`;
}
