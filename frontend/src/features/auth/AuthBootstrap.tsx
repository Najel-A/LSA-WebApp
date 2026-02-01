import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useMeQuery } from './authApi';
import { setBootstrapped } from './authSlice';

interface AuthBootstrapProps {
  children: React.ReactNode;
}

export function AuthBootstrap({ children }: AuthBootstrapProps) {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const { isSuccess, isError, isLoading } = useMeQuery(undefined, {
    skip: !accessToken,
  });

  useEffect(() => {
    if (!accessToken) {
      dispatch(setBootstrapped(true));
    }
  }, [accessToken, dispatch]);

  useEffect(() => {
    if (accessToken && (isSuccess || isError || !isLoading)) {
      dispatch(setBootstrapped(true));
    }
  }, [accessToken, isSuccess, isError, isLoading, dispatch]);

  return <>{children}</>;
}
