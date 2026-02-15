import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function AccessDeniedPage() {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16">
      <Card className="max-w-md w-full text-center space-y-4">
        <h1 className="text-xl font-bold text-neutral-900">Access denied</h1>
        <p className="text-neutral-600">
          You don&apos;t have permission to view this page.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link to="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
          <Link to="/">
            <Button variant="secondary">Home</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
