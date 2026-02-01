import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useMeQuery } from '@/features/auth/authApi';
import { setUser } from '@/features/auth/authSlice';

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
    return <p>Loading…</p>;
  }

  if (isError) {
    return (
      <div>
        <p>Session expired, please log in.</p>
        <Link to="/login">Log in</Link>
      </div>
    );
  }

  return (
    <div>
      <h1>Dashboard</h1>
      {user && <p>Hello, {user.email}</p>}
      <Link to="/">Home</Link>
    </div>
  );
}
