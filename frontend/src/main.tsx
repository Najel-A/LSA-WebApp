import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { Providers } from './app/providers';
import { AuthBootstrap } from '@/features/auth/AuthBootstrap';
import '@/features/auth/authApi'; // Inject auth endpoints into api

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <AuthBootstrap>
        <App />
      </AuthBootstrap>
    </Providers>
  </StrictMode>
);
