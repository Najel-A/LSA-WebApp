import { useCallback, useEffect, useState } from 'react';
import { useAppSelector } from '@/app/hooks';
import { readIsAlertWatched, toggleAlertWatched } from './watchStorage';

interface WatchToggleProps {
  alertId: string;
  className?: string;
}

export function WatchToggle({ alertId, className = '' }: WatchToggleProps) {
  const userId = useAppSelector((state) => state.auth.user?.id);

  const [watched, setWatchedState] = useState(false);

  useEffect(() => {
    setWatchedState(readIsAlertWatched(alertId, userId));
  }, [alertId, userId]);

  const toggle = useCallback(() => {
    setWatchedState(toggleAlertWatched(alertId, userId));
  }, [alertId, userId]);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-neutral-400 hover:text-amber-500 hover:bg-amber-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 ${className}`}
      aria-label={watched ? 'Unwatch alert' : 'Watch alert'}
      title={watched ? 'Unwatch' : 'Watch'}
    >
      {watched ? (
        <svg className="w-4 h-4 fill-amber-500 text-amber-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      )}
    </button>
  );
}
