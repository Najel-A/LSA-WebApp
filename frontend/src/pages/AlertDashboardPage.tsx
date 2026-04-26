import { useMemo, useState } from 'react';
import type { AlertItem, TimeRangeKey } from '@/types/alerts';
import { useAlertsQuery } from '@/features/alerts/alertsApi';
import { FilterSidebar, type DashboardFilters } from '@/components/dashboard/FilterSidebar';
import { FiltersDrawer } from '@/components/dashboard/FiltersDrawer';
import { AlertsTable } from '@/components/dashboard/AlertsTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const DEFAULT_FILTERS: DashboardFilters = {
  projects: [],
  environments: [],
  severity: [],
  status: [],
  timeRange: '7d',
};

function filterByTimeRange(alerts: AlertItem[], timeRange: TimeRangeKey): AlertItem[] {
  const now = Date.now();
  const ms: Record<TimeRangeKey, number> = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
  };
  const cutoff = now - ms[timeRange];
  return alerts.filter((a) => new Date(a.lastSeen).getTime() >= cutoff);
}

function applyFilters(alerts: AlertItem[], filters: DashboardFilters): AlertItem[] {
  let result = alerts;

  if (filters.projects.length > 0) {
    result = result.filter((a) => filters.projects.includes(a.project));
  }
  if (filters.environments.length > 0) {
    result = result.filter((a) => filters.environments.includes(a.environment));
  }
  if (filters.severity.length > 0) {
    result = result.filter((a) => filters.severity.includes(a.severity));
  }
  if (filters.status.length > 0) {
    result = result.filter((a) => filters.status.includes(a.status));
  }
  result = filterByTimeRange(result, filters.timeRange);
  return result;
}

export function AlertDashboardPage() {
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);

  const { data: alerts = [], isLoading, isError } = useAlertsQuery();

  const projectOptions = useMemo(() => [...new Set(alerts.map((a) => a.project))].sort(), [alerts]);
  const environmentOptions = useMemo(() => [...new Set(alerts.map((a) => a.environment))].sort(), [alerts]);

  const filteredAlerts = useMemo(() => {
    let list = applyFilters(alerts, filters);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((a) => a.title.toLowerCase().includes(q));
    }
    return list;
  }, [alerts, filters, searchQuery]);

  const hasActiveFilters =
    filters.projects.length > 0 ||
    filters.environments.length > 0 ||
    filters.severity.length > 0 ||
    filters.status.length > 0 ||
    filters.timeRange !== DEFAULT_FILTERS.timeRange ||
    searchQuery.trim().length > 0;

  const summary = useMemo(() => {
    const openIncidents = filteredAlerts.filter((a) => a.status === 'active').length;
    const validated = filteredAlerts.filter((a) => a.rcaStatus === 'validated').length;
    const needsReview = filteredAlerts.filter((a) => a.rcaStatus === 'needs_review').length;
    const muted = filteredAlerts.filter((a) => a.status === 'muted').length;
    return { openIncidents, validated, needsReview, muted };
  }, [filteredAlerts]);

  const clearAll = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchQuery('');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Incidents</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Monitor open issues — open a row for RCA workspace.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <div className="relative flex-1 sm:min-w-[280px] sm:max-w-md">
            <Input
              placeholder="Search incidents, services, or root causes"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-3"
            />
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-medium text-neutral-500 hover:text-neutral-700 hover:underline px-1 py-1"
            >
              Clear filters
            </button>
          )}
          <Button
            variant="secondary"
            onClick={() => setFiltersDrawerOpen(true)}
            className="lg:hidden"
          >
            Filters
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500">Open</p>
          <p className="text-lg font-semibold text-neutral-900">{summary.openIncidents}</p>
        </div>
        <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500">Validated RCA</p>
          <p className="text-lg font-semibold text-neutral-900">{summary.validated}</p>
        </div>
        <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500">Needs review</p>
          <p className="text-lg font-semibold text-neutral-900">{summary.needsReview}</p>
        </div>
        <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500">Muted</p>
          <p className="text-lg font-semibold text-neutral-900">{summary.muted}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar: visible on lg, replaced by drawer on smaller */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Filters</p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-[11px] font-medium text-neutral-500 hover:text-neutral-700 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
            <FilterSidebar
              filters={filters}
              onFiltersChange={setFilters}
              projectOptions={projectOptions}
              environmentOptions={environmentOptions}
            />
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          {isLoading ? (
            <div className="rounded-lg border border-neutral-200 bg-white p-12 text-center">
              <p className="text-neutral-600">Loading incidents…</p>
            </div>
          ) : isError ? (
            <div className="rounded-lg border border-red-200 bg-red-50/50 p-12 text-center">
              <p className="text-neutral-700 font-medium">Could not load incidents.</p>
              <p className="text-sm text-neutral-500 mt-1">Check the backend is running and seeded.</p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="rounded-lg border border-neutral-200 bg-white p-12 text-center">
              <p className="text-neutral-600">No incidents match these filters.</p>
              <Button
                variant="secondary"
                className="mt-4"
                onClick={clearAll}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <AlertsTable alerts={filteredAlerts} />
          )}
        </main>
      </div>

      <FiltersDrawer
        open={filtersDrawerOpen}
        onClose={() => setFiltersDrawerOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
        projectOptions={projectOptions}
        environmentOptions={environmentOptions}
      />
    </div>
  );
}
