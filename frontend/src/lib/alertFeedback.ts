import type { AlertFeedback } from '@/types/alerts';

const STORAGE_PREFIX = 'alert-feedback';

export function getFeedbackStorageKey(userId: string | undefined): string {
  return userId ? `${STORAGE_PREFIX}-${userId}` : STORAGE_PREFIX;
}

export function getFeedbackForKey(
  storageKey: string,
  alertId: string
): AlertFeedback | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, AlertFeedback>;
    return map[alertId] ?? null;
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
