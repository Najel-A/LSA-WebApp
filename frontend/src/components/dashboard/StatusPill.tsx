import type { AlertStatus } from '@/types/alerts';

const statusStyles: Record<AlertStatus, string> = {
  active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  resolved: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  muted: 'bg-neutral-100 text-neutral-500 border-neutral-200',
};

interface StatusPillProps {
  status: AlertStatus;
  className?: string;
}

export function StatusPill({ status, className = '' }: StatusPillProps) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${statusStyles[status]} ${className}`}
    >
      {label}
    </span>
  );
}
