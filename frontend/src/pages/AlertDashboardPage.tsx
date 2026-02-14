import { useMemo, useState } from 'react';
import { mockAlerts } from '@/mock/alerts';
import type { AlertItem, TimeRangeKey } from '@/types/alerts';
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

  const projectOptions = useMemo(() => [...new Set(mockAlerts.map((a) => a.project))].sort(), []);
  const environmentOptions = useMemo(() => [...new Set(mockAlerts.map((a) => a.environment))].sort(), []);

  const filteredAlerts = useMemo(() => {
    let list = applyFilters(mockAlerts, filters);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((a) => a.title.toLowerCase().includes(q));
    }
    return list;
  }, [filters, searchQuery]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Alerts</h1>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="relative flex-1 sm:min-w-[200px] sm:max-w-sm">
            <Input
              placeholder="Search alerts"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-3"
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => setFiltersDrawerOpen(true)}
            className="lg:hidden"
          >
            Filters
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar: visible on lg, replaced by drawer on smaller */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <FilterSidebar
              filters={filters}
              onFiltersChange={setFilters}
              projectOptions={projectOptions}
              environmentOptions={environmentOptions}
            />
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          {filteredAlerts.length === 0 ? (
            <div className="rounded-lg border border-neutral-200 bg-white p-12 text-center">
              <p className="text-neutral-600">No alerts match these filters.</p>
              <Button
                variant="secondary"
                className="mt-4"
                onClick={() => setFilters(DEFAULT_FILTERS)}
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
