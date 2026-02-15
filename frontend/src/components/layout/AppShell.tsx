import { Link } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { useLogoutMutation } from '@/features/auth/authApi';
import { Button } from '@/components/ui/Button';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const user = useAppSelector((state) => state.auth.user);
  const [logout] = useLogoutMutation();

  // Work on project name and logo
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-content px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="text-lg font-semibold text-neutral-900 hover:text-primary-600 transition-colors"
            >
              NexusTrace
            </Link> 
            <nav className="flex items-center gap-3 sm:gap-4">
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Button
                    variant="secondary"
                    onClick={() => logout()}
                    className="!py-1.5 !px-3 !text-sm"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-content px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
