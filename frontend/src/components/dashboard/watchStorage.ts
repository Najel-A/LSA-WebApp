const STORAGE_PREFIX = 'alerts-watched';

function getStorageKey(userId: string | undefined): string {
  return userId ? `${STORAGE_PREFIX}-${userId}` : STORAGE_PREFIX;
}

function getWatchedSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function setWatchedSet(key: string, set: Set<string>): void {
  localStorage.setItem(key, JSON.stringify([...set]));
}

export function readIsAlertWatched(alertId: string, userId: string | undefined): boolean {
  const key = getStorageKey(userId);
  return getWatchedSet(key).has(alertId);
}

export function toggleAlertWatched(alertId: string, userId: string | undefined): boolean {
  const key = getStorageKey(userId);
  const set = getWatchedSet(key);
  if (set.has(alertId)) {
    set.delete(alertId);
  } else {
    set.add(alertId);
  }
  setWatchedSet(key, set);
  return set.has(alertId);
}

