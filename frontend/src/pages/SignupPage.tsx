import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSignupMutation } from '@/features/auth/authApi';

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
    <div>
      <h1>Sign up</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="confirmPassword">Confirm password</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        {error && <p role="alert">{error}</p>}
        <button type="submit">Sign up</button>
      </form>
      <Link to="/">Back</Link> | <Link to="/login">Log in</Link>
    </div>
  );
}
