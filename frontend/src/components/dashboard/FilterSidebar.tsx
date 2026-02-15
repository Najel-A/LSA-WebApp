import { useState } from 'react';
import type { AlertSeverity, AlertStatus, TimeRangeKey } from '@/types/alerts';

export interface DashboardFilters {
  projects: string[];
  environments: string[];
  severity: AlertSeverity[];
  status: AlertStatus[];
  timeRange: TimeRangeKey;
}

interface FilterSidebarProps {
  filters: DashboardFilters;
  onFiltersChange: (f: DashboardFilters) => void;
  projectOptions: string[];
  environmentOptions: string[];
}

const SEVERITY_OPTIONS: AlertSeverity[] = ['critical', 'error', 'warning', 'info', 'debug'];
const STATUS_OPTIONS: AlertStatus[] = ['active', 'resolved', 'muted'];
const TIME_RANGE_OPTIONS: { key: TimeRangeKey; label: string }[] = [
  { key: '1h', label: 'Last 1h' },
  { key: '24h', label: 'Last 24h' },
  { key: '7d', label: 'Last 7d' },
];

function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-neutral-200 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-neutral-700"
      >
        {title}
        <span className="text-neutral-400">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  );
}

export function FilterSidebar({ filters, onFiltersChange, projectOptions, environmentOptions }: FilterSidebarProps) {
  const toggleArray = <T,>(key: keyof DashboardFilters, value: T, current: T[]) => {
    const arr = current as T[];
    const next = arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
    onFiltersChange({ ...filters, [key]: next });
  };

  const toggleSeverity = (s: AlertSeverity) => toggleArray('severity', s, filters.severity);
  const toggleStatus = (s: AlertStatus) => toggleArray('status', s, filters.status);
  const toggleProject = (p: string) => toggleArray('projects', p, filters.projects);
  const toggleEnvironment = (e: string) => toggleArray('environments', e, filters.environments);

  return (
    <div className="space-y-1">
      <CollapsibleSection title="Projects">
        <div className="space-y-1.5">
          {projectOptions.map((p) => (
            <label key={p} className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.projects.length === 0 || filters.projects.includes(p)}
                onChange={() => toggleProject(p)}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              {p}
            </label>
          ))}
        </div>
      </CollapsibleSection>
      <CollapsibleSection title="Environments">
        <div className="space-y-1.5">
          {environmentOptions.map((e) => (
            <label key={e} className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.environments.length === 0 || filters.environments.includes(e)}
                onChange={() => toggleEnvironment(e)}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              {e}
            </label>
          ))}
        </div>
      </CollapsibleSection>
      <CollapsibleSection title="Severity">
        <div className="flex flex-wrap gap-1.5">
          {SEVERITY_OPTIONS.map((s) => {
            const selected = filters.severity.length === 0 || filters.severity.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleSeverity(s)}
                className={`px-2 py-1 text-xs font-medium rounded-md border transition-colors ${
                  selected
                    ? 'bg-primary-50 border-primary-200 text-primary-700'
                    : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </CollapsibleSection>
      <CollapsibleSection title="Status">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((s) => {
            const selected = filters.status.length === 0 || filters.status.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleStatus(s)}
                className={`px-2 py-1 text-xs font-medium rounded-md border transition-colors ${
                  selected
                    ? 'bg-primary-50 border-primary-200 text-primary-700'
                    : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </CollapsibleSection>
      <CollapsibleSection title="Time Range">
        <div className="flex flex-col gap-1">
          {TIME_RANGE_OPTIONS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
              <input
                type="radio"
                name="timeRange"
                checked={filters.timeRange === key}
                onChange={() => onFiltersChange({ ...filters, timeRange: key })}
                className="border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              {label}
            </label>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}
