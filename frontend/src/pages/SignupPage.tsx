import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSignupMutation } from '@/features/auth/authApi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const [signup] = useSignupMutation();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await signup({ email, password }).unwrap();
      navigate('/login');
    } catch (err) {
      const message = err && typeof err === 'object' && 'data' in err
        ? (err.data as { error?: string })?.error ?? 'Signup failed'
        : err instanceof Error ? err.message : 'Signup failed';
      setError(message);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16">
      <Card className="max-w-md w-full space-y-6">
        <div>
          <h1>Sign up</h1>
          <p className="mt-1 text-sm text-neutral-600">Create a new account</p>
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
          <Input
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full">
            Sign up
          </Button>
        </form>
        <p className="text-center text-sm text-neutral-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}
