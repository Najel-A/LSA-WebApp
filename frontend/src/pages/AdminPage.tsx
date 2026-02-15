import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function AdminPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">Admin</h1>
      <Card>
        <p className="text-neutral-600">Admin-only content.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/admin/model">
            <Button>Model</Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="secondary">Dashboard</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
