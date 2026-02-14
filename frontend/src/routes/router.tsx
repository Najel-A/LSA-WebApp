import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { RequireAuth } from './RequireAuth';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { AlertDashboardPage } from '@/pages/AlertDashboardPage';
import { AlertDetailPage } from '@/pages/AlertDetailPage';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/signup',
        element: <SignupPage />,
      },
      {
        path: '/app',
        element: (
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        ),
      },
      {
        path: '/dashboard',
        element: (
          <RequireAuth>
            <AlertDashboardPage />
          </RequireAuth>
        ),
      },
      {
        path: '/alerts/:id',
        element: (
          <RequireAuth>
            <AlertDetailPage />
          </RequireAuth>
        ),
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
