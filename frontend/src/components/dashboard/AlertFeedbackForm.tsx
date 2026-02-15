import { useCallback, useEffect, useState } from 'react';
import { useAppSelector } from '@/app/hooks';
import type { AlertFeedback, AlertFeedbackVerdict } from '@/types/alerts';
import {
  getFeedbackStorageKey,
  getFeedbackForKey,
  setFeedbackForKey,
} from '@/lib/alertFeedback';
import { Card } from '@/components/ui/Card';

const EMPTY_FEEDBACK: AlertFeedback = {
  verdict: null,
  rootCause: '',
  note: '',
  updatedAt: '',
};

interface AlertFeedbackFormProps {
  alertId: string;
}

export function AlertFeedbackForm({ alertId }: AlertFeedbackFormProps) {
  const userId = useAppSelector((state) => state.auth.user?.id);
  const storageKey = getFeedbackStorageKey(userId);

  const [feedback, setFeedback] = useState<AlertFeedback>(EMPTY_FEEDBACK);

  useEffect(() => {
    const stored = getFeedbackForKey(storageKey, alertId);
    setFeedback(
      stored
        ? {
            verdict: stored.verdict,
            rootCause: stored.rootCause ?? '',
            note: stored.note ?? '',
            updatedAt: stored.updatedAt ?? '',
          }
        : EMPTY_FEEDBACK
    );
  }, [alertId, storageKey]);

  const persist = useCallback(
    (next: AlertFeedback) => {
      setFeedback(next);
      setFeedbackForKey(storageKey, alertId, { ...next, updatedAt: new Date().toISOString() });
    },
    [alertId, storageKey]
  );

  const setVerdict = useCallback(
    (verdict: AlertFeedbackVerdict | null) => {
      persist({ ...feedback, verdict });
    },
    [feedback, persist]
  );

  const setRootCause = useCallback(
    (rootCause: string) => {
      persist({ ...feedback, rootCause });
    },
    [feedback, persist]
  );

  const setNote = useCallback(
    (note: string) => {
      persist({ ...feedback, note });
    },
    [feedback, persist]
  );

  return (
    <Card>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-3">
        Your feedback
      </h2>

      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-neutral-700 mb-2">Verdict</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setVerdict(feedback.verdict === 'valid' ? null : 'valid')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-colors ${
                feedback.verdict === 'valid'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
              }`}
            >
              Valid
            </button>
            <button
              type="button"
              onClick={() => setVerdict(feedback.verdict === 'false_positive' ? null : 'false_positive')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-colors ${
                feedback.verdict === 'false_positive'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
              }`}
            >
              False Positive
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="feedback-root-cause" className="block text-sm font-medium text-neutral-700 mb-1">
            Root Cause
          </label>
          <textarea
            id="feedback-root-cause"
            value={feedback.rootCause}
            onChange={(e) => setRootCause(e.target.value)}
            placeholder="Describe the root cause if known"
            rows={2}
            className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div>
          <label htmlFor="feedback-note" className="block text-sm font-medium text-neutral-700 mb-1">
            Note
          </label>
          <textarea
            id="feedback-note"
            value={feedback.note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note"
            rows={2}
            className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {feedback.updatedAt && (
          <p className="text-xs text-neutral-500">
            Last updated: {new Date(feedback.updatedAt).toLocaleString()}
          </p>
        )}
      </div>
    </Card>
  );
}
