import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';

interface AdminRouteProps {
  children: React.ReactNode;
}

/** Requires authentication and role === "admin". Redirects to login if not authenticated, to /access-denied if not admin. */
export function AdminRoute({ children }: AdminRouteProps) {
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

  if (user.role !== 'admin') {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
}
