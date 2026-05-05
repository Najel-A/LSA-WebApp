import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getMyTriageFeedback } from '@/services/triageFeedbackApi';
import type { TriageFeedback } from '@/types/triageFeedback';
import { useAlertsQuery } from '@/features/alerts/alertsApi';

type DiagnosisFilter = 'all' | 'correct' | 'partial' | 'incorrect';

export function TriagePage() {
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const [rows, setRows] = useState<TriageFeedback[]>([]);
  const [phase, setPhase] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [diagnosisFilter, setDiagnosisFilter] = useState<DiagnosisFilter>('all');
  // Refetch when entering triage so new alerts are visible.
  const { data: alerts = [] } = useAlertsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    let mounted = true;
    setError(null);
    setPhase('loading');
    setRows([]);

    if (!accessToken) {
      setPhase('idle');
      return;
    }

    (async () => {
      try {
        const data = await getMyTriageFeedback(accessToken);
        if (!mounted) return;
        setRows(data);
        setPhase('idle');
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Failed to load triage feedback');
        setPhase('error');
      }
    })();

    return () => {
      mounted = false;
    };
  }, [accessToken]);

  const enriched = useMemo(() => {
    const byId = new Map(alerts.map((a) => [a.id, a]));
    return rows.map((r) => {
      const alert = byId.get(r.incidentId);
      return {
        ...r,
        incidentTitle: r.incidentTitle ?? alert?.title ?? r.incidentId,
      };
    });
  }, [rows, alerts]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return enriched.filter((r) => {
      if (diagnosisFilter !== 'all' && r.diagnosisCorrectness !== diagnosisFilter) return false;
      if (!query) return true;
      return (r.incidentTitle ?? r.incidentId).toLowerCase().includes(query);
    });
  }, [enriched, q, diagnosisFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Triage</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Your submitted triage feedback (review history).</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="sm:min-w-[280px]">
            <Input
              placeholder="Search by incident title"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select
            value={diagnosisFilter}
            onChange={(e) => setDiagnosisFilter(e.target.value as DiagnosisFilter)}
            className="h-10 rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="all">All diagnoses</option>
            <option value="correct">Correct</option>
            <option value="partial">Partial</option>
            <option value="incorrect">Incorrect</option>
          </select>
        </div>
      </div>

      {!accessToken && (
        <Card className="max-w-md">
          <p className="text-sm text-neutral-700">Log in to view your triage feedback history.</p>
          <div className="mt-4">
            <Link to="/login">
              <Button>Log in</Button>
            </Link>
          </div>
        </Card>
      )}

      {accessToken && phase === 'loading' && (
        <div className="py-12 text-center">
          <p className="text-neutral-600">Loading triage feedback…</p>
        </div>
      )}

      {accessToken && phase === 'error' && (
        <Card className="border-red-200 bg-red-50/50">
          <h2 className="text-sm font-semibold text-red-800 mb-1">Could not load triage feedback</h2>
          <p className="text-sm text-red-700">{error ?? 'Unknown error'}</p>
        </Card>
      )}

      {accessToken && phase !== 'loading' && filtered.length === 0 && (
        <Card className="py-12 text-center">
          <p className="text-neutral-700 font-medium">No triage feedback yet.</p>
          <p className="text-sm text-neutral-500 mt-1">
            Open an incident and submit feedback from the incident detail page.
          </p>
          <div className="mt-4">
            <Link to="/dashboard">
              <Button variant="secondary">Go to incidents</Button>
            </Link>
          </div>
        </Card>
      )}

      {accessToken && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.id ?? `${r.incidentId}-${r.submittedAt}`} className="py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-neutral-900 truncate">
                    {r.incidentTitle ?? r.incidentId}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-neutral-600">
                    <span className="capitalize">
                      Diagnosis: <strong className="text-neutral-800">{r.diagnosisCorrectness}</strong>
                    </span>
                    <span className="capitalize">
                      Fix: <strong className="text-neutral-800">{r.fixUsefulness.replace('_', ' ')}</strong>
                    </span>
                    <span className="text-neutral-500">
                      {new Date((r.updatedAt ?? r.submittedAt) as string).toLocaleString()}
                    </span>
                  </div>
                </div>
                <Link to={`/alerts/${r.incidentId}`}>
                  <Button variant="secondary" className="!py-1.5 !px-3 !text-xs shrink-0">
                    Open & edit
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

