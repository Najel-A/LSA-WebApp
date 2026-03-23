import { Link, useNavigate } from 'react-router-dom';
import type { AlertItem, RcaConfidenceBand, RcaStatus } from '@/types/alerts';
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

const rcaStatusStyles: Record<RcaStatus, string> = {
  pending: 'bg-neutral-100 text-neutral-600',
  analyzing: 'bg-primary-100 text-primary-800',
  validated: 'bg-emerald-100 text-emerald-800',
  needs_review: 'bg-amber-100 text-amber-800',
};

const rcaStatusLabel: Record<RcaStatus, string> = {
  pending: 'Pending',
  analyzing: 'Analyzing',
  validated: 'Validated',
  needs_review: 'Review',
};

const confStyles: Record<RcaConfidenceBand, string> = {
  low: 'text-neutral-500',
  medium: 'text-amber-700',
  high: 'text-emerald-700',
};

interface AlertsTableProps {
  alerts: AlertItem[];
}

export function AlertsTable({ alerts }: AlertsTableProps) {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-neutral-200 text-sm">
        <thead className="bg-neutral-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Title
            </th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 whitespace-nowrap">
              RCA
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Trend
            </th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Total
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">
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
              tabIndex={0}
              role="link"
              aria-label={`Open incident ${alert.title}`}
              className="hover:bg-primary-50/50 focus-visible:bg-primary-50/50 focus-visible:outline-none transition-colors cursor-pointer"
              onClick={(e) => {
                const t = e.target as HTMLElement;
                if (t.closest('a, button')) return;
                navigate(`/alerts/${alert.id}`);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/alerts/${alert.id}`);
                }
              }}
            >
              <td className="px-4 py-3.5 sm:py-4">
                <Link
                  to={`/alerts/${alert.id}`}
                  className="font-semibold text-primary-700 hover:text-primary-800 hover:underline leading-snug"
                  onClick={(e) => e.stopPropagation()}
                >
                  {alert.title}
                </Link>
              </td>
              <td className="px-3 py-3.5 sm:py-4 align-top">
                <div className="flex flex-col gap-1.5 min-w-[6.25rem]">
                  <span
                    className={`inline-flex w-fit px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-md ${rcaStatusStyles[alert.rcaStatus]}`}
                  >
                    {rcaStatusLabel[alert.rcaStatus]}
                  </span>
                  <span className={`text-[11px] font-medium capitalize ${confStyles[alert.rcaConfidence]}`}>
                    Confidence: {alert.rcaConfidence}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3.5 sm:py-4 opacity-80">
                <TrendSparkline values={alert.trend} />
              </td>
              <td className="px-4 py-3.5 sm:py-4 text-right text-neutral-500 tabular-nums">
                {alert.total}
              </td>
              <td className="px-4 py-3.5 sm:py-4 text-neutral-500">
                {formatLastSeen(alert.lastSeen)}
              </td>
              <td className="px-4 py-3.5 sm:py-4 text-neutral-700 font-medium">
                {alert.environment}
              </td>
              <td className="px-4 py-3.5 sm:py-4">
                <StatusPill status={alert.status} />
              </td>
              <td className="px-4 py-3.5 sm:py-4" onClick={(e) => e.stopPropagation()}>
                <WatchToggle alertId={alert.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
