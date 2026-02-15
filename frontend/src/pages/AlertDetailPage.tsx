import { Link, useParams } from 'react-router-dom';
import { mockAlerts } from '@/mock/alerts';
import { mockAlertEvents } from '@/mock/alerts';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { WatchToggle } from '@/components/dashboard/WatchToggle';

function formatLastSeen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function AlertDetailPage() {
  const { id } = useParams<{ id: string }>();
  const alert = id ? mockAlerts.find((a) => a.id === id) : null;
  const events = id ? mockAlertEvents.filter((e) => e.alertId === id) : [];
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (!id || !alert) {
    return (
      <div className="space-y-4">
        <Card className="max-w-md mx-auto text-center py-12">
          <p className="text-neutral-600 mb-4">Alert not found.</p>
          <Link to="/dashboard">
            <Button variant="secondary">Back to Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <Link
          to="/dashboard"
          className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline inline-flex items-center gap-1"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-neutral-900 truncate">{alert.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusPill status={alert.status} />
            <span className="text-sm text-neutral-500">{alert.environment}</span>
            <span className="text-sm text-neutral-500">
              Last seen: {formatLastSeen(alert.lastSeen)}
            </span>
          </div>
        </div>
        <div className="shrink-0">
          <WatchToggle alertId={alert.id} />
        </div>
      </div>

      {/* Panels */}
      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-3">
            AI Summary
          </h2>
          <p className="text-neutral-600 text-sm">
            Summary will appear here. This alert is a {alert.severity}-level issue in {alert.environment}.
          </p>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-3">
            Recent Events
          </h2>
          {sortedEvents.length === 0 ? (
            <p className="text-sm text-neutral-500">No recent events.</p>
          ) : (
            <ul className="space-y-2 divide-y divide-neutral-100">
              {sortedEvents.slice(0, 10).map((ev) => (
                <li key={ev.id} className="pt-2 first:pt-0">
                  <p className="text-sm text-neutral-900 font-mono truncate" title={ev.message}>
                    {ev.message}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {formatTime(ev.timestamp)}
                    {ev.level && ` · ${ev.level}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-3">
          Timeline
        </h2>
        {sortedEvents.length === 0 ? (
          <p className="text-sm text-neutral-500">No timeline events.</p>
        ) : (
          <ul className="relative space-y-4">
            {sortedEvents.map((ev, i) => (
              <li key={ev.id} className="relative flex gap-4">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-3 h-3 rounded-full bg-primary-500" />
                  {i < sortedEvents.length - 1 && (
                    <div className="w-0.5 flex-1 min-h-[1rem] bg-neutral-200 my-1" />
                  )}
                </div>
                <div className="pb-4 min-w-0">
                  <p className="text-xs font-medium text-neutral-500">
                    {formatLastSeen(ev.timestamp)}
                  </p>
                  <p className="text-sm text-neutral-700 mt-0.5 truncate" title={ev.message}>
                    {ev.message}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
