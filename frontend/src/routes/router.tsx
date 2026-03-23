import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { RequireAuth } from './RequireAuth';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminRoute } from './AdminRoute';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { AlertDashboardPage } from '@/pages/AlertDashboardPage';
import { AlertDetailPage } from '@/pages/AlertDetailPage';
import { AccessDeniedPage } from '@/pages/AccessDeniedPage';
import { AdminPage } from '@/pages/AdminPage';
import { AdminModelPage } from '@/pages/AdminModelPage';
import { AnalyzePage } from '@/pages/AnalyzePage';

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
          <ProtectedRoute>
            <AlertDashboardPage />
          </ProtectedRoute>
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
        path: '/access-denied',
        element: <AccessDeniedPage />,
      },
      {
        path: '/admin',
        element: (
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        ),
      },
      {
        path: '/admin/model',
        element: (
          <AdminRoute>
            <AdminModelPage />
          </AdminRoute>
        ),
      },
      {
        path: '/analyze',
        element: (
          <ProtectedRoute>
            <AnalyzePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/tools/analyze',
        element: <Navigate to="/analyze" replace />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
