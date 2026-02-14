import { Link } from 'react-router-dom';
import type { AlertItem } from '@/types/alerts';
import { StatusPill } from './StatusPill';
import { WatchToggle } from './WatchToggle';

function formatLastSeen(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffM = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffM < 60) return `${diffM}m`;
  if (diffH < 24) return `${diffH}h`;
  return `${diffD}d`;
}

function TrendSparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-0.5 h-6 w-16" aria-hidden>
      {values.map((v, i) => (
        <div
          key={i}
          className="flex-1 min-w-[2px] rounded-sm bg-neutral-300"
          style={{ height: `${(v / max) * 100}%`, minHeight: v > 0 ? 2 : 0 }}
        />
      ))}
    </div>
  );
}

interface AlertsTableProps {
  alerts: AlertItem[];
}

export function AlertsTable({ alerts }: AlertsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
      <table className="min-w-full divide-y divide-neutral-200 text-sm">
        <thead className="bg-neutral-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Title
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Trend
            </th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Total
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Last Seen
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Environment
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Status
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 w-12">
              Watch
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 bg-white">
          {alerts.map((alert) => (
            <tr
              key={alert.id}
              className="hover:bg-neutral-50 transition-colors group"
            >
              <td className="px-4 py-3">
                <Link
                  to={`/alerts/${alert.id}`}
                  className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
                >
                  {alert.title}
                </Link>
              </td>
              <td className="px-4 py-3">
                <TrendSparkline values={alert.trend} />
              </td>
              <td className="px-4 py-3 text-right text-neutral-700 tabular-nums">
                {alert.total}
              </td>
              <td className="px-4 py-3 text-neutral-600">
                {formatLastSeen(alert.lastSeen)}
              </td>
              <td className="px-4 py-3 text-neutral-600">
                {alert.environment}
              </td>
              <td className="px-4 py-3">
                <StatusPill status={alert.status} />
              </td>
              <td className="px-4 py-3">
                <WatchToggle alertId={alert.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
