import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/app/hooks';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { submitTriageFeedback, getTriageFeedbackForIncident, updateTriageFeedback } from '@/services/triageFeedbackApi';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

type TriageFormValues = {
  diagnosisCorrectness: 'correct' | 'partial' | 'incorrect' | null;
  fixUsefulness: 'useful' | 'partial' | 'not_useful' | null;
  actualRootCause: string;
  actualFix: string;
  notes: string;
};

const EMPTY: TriageFormValues = {
  diagnosisCorrectness: null,
  fixUsefulness: null,
  actualRootCause: '',
  actualFix: '',
  notes: '',
};

interface AlertFeedbackFormProps {
  alertId: string;
  alertTitle?: string;
  isTriaged?: boolean;
}

function PillToggle<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T | null;
  options: { value: T; label: string }[];
  onChange: (v: T | null) => void;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-neutral-600 mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(value === opt.value ? null : opt.value)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
              value === opt.value
                ? 'bg-primary-50 border-primary-200 text-primary-800'
                : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AlertFeedbackForm({ alertId, alertTitle, isTriaged = false }: AlertFeedbackFormProps) {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const userEmail = useAppSelector((state) => state.auth.user?.email);

  const [values, setValues] = useState<TriageFormValues>(EMPTY);
  const [existing, setExisting] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [state, setState] = useState<FormState>('idle');
  const [error, setError] = useState<string | null>(null);
  const submitLabel = existing ? 'Update Feedback' : 'Submit Feedback';

  const canSubmit = useMemo(() => {
    return !!values.diagnosisCorrectness && !!values.fixUsefulness;
  }, [values.diagnosisCorrectness, values.fixUsefulness]);

  useEffect(() => {
    let mounted = true;
    setState('idle');
    setError(null);
    setExisting(false);
    setLastSavedAt(null);
    setValues(EMPTY);

    // Only fetch previously submitted feedback once the incident is in a triaged state.
    // This keeps the incident workflow snappy (no GET for untriaged incidents).
    if (!accessToken || !isTriaged) return;

    (async () => {
      try {
        const row = await getTriageFeedbackForIncident(accessToken, alertId);
        if (!mounted) return;
        if (!row) return;
        setExisting(true);
        setValues({
          diagnosisCorrectness: row.diagnosisCorrectness ?? null,
          fixUsefulness: row.fixUsefulness ?? null,
          actualRootCause: row.actualRootCause ?? '',
          actualFix: row.actualFix ?? '',
          notes: row.notes ?? '',
        });
        setLastSavedAt(row.updatedAt ?? row.submittedAt ?? null);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Failed to load feedback');
      }
    })();

    return () => {
      mounted = false;
    };
  }, [accessToken, alertId, isTriaged]);

  const patch = useCallback(
    (partial: Partial<TriageFormValues>) => {
      setValues((prev) => ({ ...prev, ...partial }));
    },
    []
  );

  const onSubmit = useCallback(async () => {
    if (!accessToken || !userEmail) {
      setState('error');
      setError('You must be logged in to submit triage feedback.');
      return;
    }
    if (!values.diagnosisCorrectness || !values.fixUsefulness) {
      setState('error');
      setError('Please select diagnosis correctness and fix usefulness.');
      return;
    }

    setState('submitting');
    setError(null);
    try {
      const input = {
        incidentId: alertId,
        incidentTitle: alertTitle,
        diagnosisCorrectness: values.diagnosisCorrectness,
        fixUsefulness: values.fixUsefulness,
        actualRootCause: values.actualRootCause,
        actualFix: values.actualFix,
        notes: values.notes,
      };
      const saved = existing
        ? await updateTriageFeedback(accessToken, input)
        : await submitTriageFeedback(accessToken, input);
      setExisting(true);
      setLastSavedAt(saved.updatedAt ?? saved.submittedAt ?? new Date().toISOString());
      setState('success');
      window.setTimeout(() => setState('idle'), 1500);
    } catch (e) {
      setState('error');
      setError(e instanceof Error ? e.message : 'Failed to save feedback');
    }
  }, [accessToken, userEmail, values, alertId, alertTitle, existing]);

  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-1">
            Triage feedback
          </h2>
          <p className="text-xs text-neutral-500">
            Help improve RCA quality by comparing the system output to what you observed.
          </p>
        </div>
        <div className="shrink-0">
          <Button
            onClick={() => void onSubmit()}
            disabled={!accessToken || state === 'submitting' || !canSubmit}
            className="w-full sm:w-auto"
          >
            {state === 'submitting' ? 'Submitting…' : submitLabel}
          </Button>
        </div>
      </div>

      <div className="mt-3">
        {state === 'success' && (
          <p className="text-xs font-medium text-emerald-700">Saved triage feedback.</p>
        )}
        {state === 'error' && (
          <p className="text-xs font-medium text-red-700">{error ?? 'Failed to save feedback.'}</p>
        )}
        {lastSavedAt && (
          <p className="text-xs text-neutral-500">
            Last saved: {new Date(lastSavedAt).toLocaleString()}
          </p>
        )}
        {!accessToken && (
          <p className="text-xs text-neutral-500">Log in to submit triage feedback.</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <PillToggle
          label="Diagnosis correctness"
          value={values.diagnosisCorrectness}
          onChange={(v) => patch({ diagnosisCorrectness: v })}
          options={[
            { value: 'correct', label: 'Correct' },
            { value: 'partial', label: 'Partial' },
            { value: 'incorrect', label: 'Incorrect' },
          ]}
        />
        <PillToggle
          label="Fix usefulness"
          value={values.fixUsefulness}
          onChange={(v) => patch({ fixUsefulness: v })}
          options={[
            { value: 'useful', label: 'Useful' },
            { value: 'partial', label: 'Partial' },
            { value: 'not_useful', label: 'Not useful' },
          ]}
        />
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <label htmlFor="fb-actual-rca" className="block text-xs font-medium text-neutral-700 mb-1">
            What was the actual root cause?
          </label>
          <textarea
            id="fb-actual-rca"
            value={values.actualRootCause}
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
            value={values.actualFix}
            onChange={(e) => patch({ actualFix: e.target.value })}
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
            value={values.notes}
            onChange={(e) => patch({ notes: e.target.value })}
            rows={2}
            placeholder="Anything else for the team…"
            className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>
    </Card>
  );
}
