import { useCallback, useEffect, useState } from 'react';
import { useAppSelector } from '@/app/hooks';
import type { AlertFeedback } from '@/types/alerts';
import {
  getFeedbackStorageKey,
  getFeedbackForKey,
  setFeedbackForKey,
} from '@/lib/alertFeedback';
import { Card } from '@/components/ui/Card';

const EMPTY: AlertFeedback = {
  diagnosisCorrect: null,
  fixUseful: null,
  actualRootCause: '',
  fixWorked: '',
  notes: '',
  updatedAt: '',
};

interface AlertFeedbackFormProps {
  alertId: string;
}

function YesNoToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: 'yes' | 'no' | null;
  onChange: (v: 'yes' | 'no' | null) => void;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-neutral-600 mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {(['yes', 'no'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(value === v ? null : v)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
              value === v
                ? 'bg-primary-50 border-primary-200 text-primary-800'
                : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
            }`}
          >
            {v === 'yes' ? 'Yes' : 'No'}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AlertFeedbackForm({ alertId }: AlertFeedbackFormProps) {
  const userId = useAppSelector((state) => state.auth.user?.id);
  const storageKey = getFeedbackStorageKey(userId);
  const [fb, setFb] = useState<AlertFeedback>(EMPTY);

  useEffect(() => {
    const stored = getFeedbackForKey(storageKey, alertId);
    setFb(
      stored
        ? {
            diagnosisCorrect: stored.diagnosisCorrect,
            fixUseful: stored.fixUseful,
            actualRootCause: stored.actualRootCause ?? '',
            fixWorked: stored.fixWorked ?? '',
            notes: stored.notes ?? '',
            updatedAt: stored.updatedAt ?? '',
          }
        : EMPTY
    );
  }, [alertId, storageKey]);

  const patch = useCallback(
    (partial: Partial<AlertFeedback>) => {
      setFb((prev) => {
        const next = { ...prev, ...partial };
        setFeedbackForKey(storageKey, alertId, next);
        return { ...next, updatedAt: new Date().toISOString() };
      });
    },
    [alertId, storageKey]
  );

  return (
    <Card>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-1">
        Triage feedback
      </h2>
      <p className="text-xs text-neutral-500 mb-4">
        Help improve RCA quality by comparing the system output to what you observed.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <YesNoToggle
          label="Was this diagnosis correct?"
          value={fb.diagnosisCorrect}
          onChange={(v) => patch({ diagnosisCorrect: v })}
        />
        <YesNoToggle
          label="Was the recommended fix useful?"
          value={fb.fixUseful}
          onChange={(v) => patch({ fixUseful: v })}
        />
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <label htmlFor="fb-actual-rca" className="block text-xs font-medium text-neutral-700 mb-1">
            What was the actual root cause?
          </label>
          <textarea
            id="fb-actual-rca"
            value={fb.actualRootCause}
            onChange={(e) => patch({ actualRootCause: e.target.value })}
            rows={2}
            placeholder="If different from the suggested diagnosis…"
            className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <div>
          <label htmlFor="fb-fix-worked" className="block text-xs font-medium text-neutral-700 mb-1">
            What fix worked?
          </label>
          <textarea
            id="fb-fix-worked"
            value={fb.fixWorked}
            onChange={(e) => patch({ fixWorked: e.target.value })}
            rows={2}
            placeholder="Steps, PR, or command that resolved it…"
            className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <div>
          <label htmlFor="fb-notes" className="block text-xs font-medium text-neutral-700 mb-1">
            Optional notes
          </label>
          <textarea
            id="fb-notes"
            value={fb.notes}
            onChange={(e) => patch({ notes: e.target.value })}
            rows={2}
            placeholder="Anything else for the team…"
            className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      {fb.updatedAt && (
        <p className="text-xs text-neutral-500 mt-3">Last updated: {new Date(fb.updatedAt).toLocaleString()}</p>
      )}
    </Card>
  );
}
