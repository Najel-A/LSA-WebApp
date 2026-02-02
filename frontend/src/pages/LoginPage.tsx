import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLoginMutation } from '@/features/auth/authApi';
import { setCredentials } from '@/features/auth/authSlice';
import { useAppDispatch } from '@/app/hooks';

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
      console.log('Login response:', response);
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
    <div>
      <h1>Login</h1>
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
        {error && <p role="alert">{error}</p>}
        <button type="submit">Log in</button>
      </form>
      <Link to="/">Back</Link> | <Link to="/signup">Sign up</Link>
    </div>
  );
}
