import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLoginMutation } from '@/features/auth/authApi';
import { setCredentials } from '@/features/auth/authSlice';
import { useAppDispatch } from '@/app/hooks';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [login] = useLoginMutation();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const response = await login({ email, password }).unwrap();
      dispatch(setCredentials({ user: response.user, accessToken: response.accessToken }));
      navigate('/app');
    } catch (err) {
      const message = err && typeof err === 'object' && 'data' in err
        ? (err.data as { error?: string })?.error ?? 'Login failed'
        : err instanceof Error ? err.message : 'Login failed';
      setError(message);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16">
      <Card className="max-w-md w-full space-y-6">
        <div>
          <h1>Login</h1>
          <p className="mt-1 text-sm text-neutral-600">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full">
            Log in
          </Button>
        </form>
        <p className="text-center text-sm text-neutral-600">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="font-medium text-primary-600 hover:text-primary-700">
            Sign up
          </Link>
        </p>
      </Card>
    </div>
  );
}
