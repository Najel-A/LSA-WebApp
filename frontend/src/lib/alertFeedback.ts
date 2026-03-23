import type { AlertFeedback } from '@/types/alerts';

const STORAGE_PREFIX = 'alert-feedback';

export function getFeedbackStorageKey(userId: string | undefined): string {
  return userId ? `${STORAGE_PREFIX}-${userId}` : STORAGE_PREFIX;
}

/** Migrate legacy { verdict, rootCause, note } to new shape */
function normalizeFeedback(raw: unknown): AlertFeedback | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if ('diagnosisCorrect' in o && typeof o.diagnosisCorrect !== 'undefined') {
    return {
      diagnosisCorrect: (o.diagnosisCorrect as AlertFeedback['diagnosisCorrect']) ?? null,
      fixUseful: (o.fixUseful as AlertFeedback['fixUseful']) ?? null,
      actualRootCause: String(o.actualRootCause ?? ''),
      fixWorked: String(o.fixWorked ?? ''),
      notes: String(o.notes ?? ''),
      updatedAt: String(o.updatedAt ?? new Date().toISOString()),
    };
  }
  const verdict = o.verdict as string | null | undefined;
  return {
    diagnosisCorrect: verdict === 'valid' ? 'yes' : verdict === 'false_positive' ? 'no' : null,
    fixUseful: null,
    actualRootCause: String(o.rootCause ?? ''),
    fixWorked: '',
    notes: String(o.note ?? ''),
    updatedAt: String(o.updatedAt ?? new Date().toISOString()),
  };
}

export function getFeedbackForKey(
  storageKey: string,
  alertId: string
): AlertFeedback | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, unknown>;
    const row = map[alertId];
    return normalizeFeedback(row);
  } catch {
    return null;
  }
}

export function setFeedbackForKey(
  storageKey: string,
  alertId: string,
  feedback: AlertFeedback
): void {
  try {
    const raw = localStorage.getItem(storageKey);
    const map = (raw ? JSON.parse(raw) : {}) as Record<string, AlertFeedback>;
    map[alertId] = { ...feedback, updatedAt: new Date().toISOString() };
    localStorage.setItem(storageKey, JSON.stringify(map));
  } catch {
    // ignore
  }
}
