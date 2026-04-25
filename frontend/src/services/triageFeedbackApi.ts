import type { TriageFeedback } from '@/types/triageFeedback';

const baseUrl =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? '' : 'http://localhost:3000');

function authHeaders(accessToken: string | null | undefined): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return headers;
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    return data?.error ?? `${res.status} ${res.statusText}`;
  } catch {
    return `${res.status} ${res.statusText}`;
  }
}

export type UpsertTriageFeedbackInput = Omit<TriageFeedback, 'id' | 'userEmail' | 'submittedAt' | 'updatedAt'> & {
  incidentId: string;
};

export async function submitTriageFeedback(
  accessToken: string | null | undefined,
  input: UpsertTriageFeedbackInput
): Promise<TriageFeedback> {
  const res = await fetch(`${baseUrl}/api/triage-feedback`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(accessToken),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  const doc = (await res.json()) as Record<string, unknown>;
  return normalizeDoc(doc);
}

// For now, updates are an upsert POST as well (keeps workflow simple).
export async function updateTriageFeedback(
  accessToken: string | null | undefined,
  input: UpsertTriageFeedbackInput
): Promise<TriageFeedback> {
  return await submitTriageFeedback(accessToken, input);
}

export async function getMyTriageFeedback(
  accessToken: string | null | undefined
): Promise<TriageFeedback[]> {
  const res = await fetch(`${baseUrl}/api/triage-feedback/me`, {
    method: 'GET',
    credentials: 'include',
    headers: authHeaders(accessToken),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  const rows = (await res.json()) as unknown[];
  return rows.map((r) => normalizeDoc(r as Record<string, unknown>));
}

export async function getTriageFeedbackForIncident(
  accessToken: string | null | undefined,
  incidentId: string
): Promise<TriageFeedback | null> {
  const res = await fetch(`${baseUrl}/api/triage-feedback/incident/${encodeURIComponent(incidentId)}`, {
    method: 'GET',
    credentials: 'include',
    headers: authHeaders(accessToken),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  const row = (await res.json()) as Record<string, unknown> | null;
  return row ? normalizeDoc(row) : null;
}

function normalizeDoc(doc: Record<string, unknown>): TriageFeedback {
  const id = typeof doc._id === 'string' ? doc._id : typeof doc.id === 'string' ? doc.id : undefined;
  return {
    id,
    incidentId: String(doc.incidentId ?? ''),
    incidentTitle: typeof doc.incidentTitle === 'string' ? doc.incidentTitle : undefined,
    userEmail: String(doc.userEmail ?? ''),
    diagnosisCorrectness: doc.diagnosisCorrectness as TriageFeedback['diagnosisCorrectness'],
    fixUsefulness: doc.fixUsefulness as TriageFeedback['fixUsefulness'],
    actualRootCause: typeof doc.actualRootCause === 'string' ? doc.actualRootCause : undefined,
    actualFix: typeof doc.actualFix === 'string' ? doc.actualFix : undefined,
    notes: typeof doc.notes === 'string' ? doc.notes : undefined,
    submittedAt: String(doc.submittedAt ?? ''),
    updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : undefined,
  };
}

