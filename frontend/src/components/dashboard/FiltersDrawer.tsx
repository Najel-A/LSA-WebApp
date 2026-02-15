import { useEffect } from 'react';
import { FilterSidebar, type DashboardFilters } from './FilterSidebar';

interface FiltersDrawerProps {
  open: boolean;
  onClose: () => void;
  filters: DashboardFilters;
  onFiltersChange: (f: DashboardFilters) => void;
  projectOptions: string[];
  environmentOptions: string[];
}

export function FiltersDrawer({
  open,
  onClose,
  filters,
  onFiltersChange,
  projectOptions,
  environmentOptions,
}: FiltersDrawerProps) {
  useEffect(() => {
    if (open) {
      const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
      document.addEventListener('keydown', handler);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handler);
        document.body.style.overflow = '';
      };
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        role="presentation"
        className="fixed inset-0 z-40 bg-neutral-900/50 transition-opacity"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm bg-white shadow-xl flex flex-col"
        aria-modal
        aria-label="Filters"
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <h2 className="text-lg font-semibold text-neutral-900">Filters</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-md text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Close filters"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <FilterSidebar
            filters={filters}
            onFiltersChange={onFiltersChange}
            projectOptions={projectOptions}
            environmentOptions={environmentOptions}
          />
        </div>
      </div>
    </>
  );
}
