import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useMeQuery } from '@/features/auth/authApi';
import { setUser } from '@/features/auth/authSlice';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function DashboardPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { data, isLoading, isError, isSuccess } = useMeQuery();

  useEffect(() => {
    if (isSuccess && data && !user) {
      dispatch(
        setUser({
          id: data.id,
          email: data.email,
          role: data.role,
        })
      );
    }
  }, [isSuccess, data, user, dispatch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-neutral-600">Loading…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Card className="max-w-md w-full text-center space-y-4">
          <p className="text-neutral-600">Session expired, please log in.</p>
          <Link to="/login">
            <Button>Log in</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="space-y-2">
          <h1>Dashboard</h1>
          {user && (
            <p className="text-neutral-600">Hello, {user.email}</p>
          )}
        </div>
        <div className="mt-6">
          <Link to="/">
            <Button variant="secondary">Home</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
