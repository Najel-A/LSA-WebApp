import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function WelcomePage() {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16">
      <Card className="max-w-md w-full text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-neutral-900">Welcome</h1>
          <p className="text-sm text-neutral-600 sm:text-base">
            Sign in to your account or create a new one to get started.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to="/login">
            <Button variant="secondary" className="w-full sm:w-auto">
              Login
            </Button>
          </Link>
          <Link to="/signup">
            <Button className="w-full sm:w-auto">Sign up</Button>
          </Link>
          <Link to="/app">
            <Button variant="secondary" className="w-full sm:w-auto">
              App
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
