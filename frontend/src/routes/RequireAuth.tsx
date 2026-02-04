import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';

interface RequireAuthProps {
  children: React.ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { user, isBootstrapped } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (!isBootstrapped) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-neutral-600">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
