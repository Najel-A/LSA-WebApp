import { Link } from 'react-router-dom';

export function WelcomePage() {
  return (
    <div>
      <h1>Welcome</h1>
      <nav>
        <Link to="/login">Login</Link> | <Link to="/signup">Sign up</Link> |{' '}
        <Link to="/app">App</Link>
      </nav>
    </div>
  );
}
