import type { Request } from 'express';

/** User payload attached to request after JWT verification (auth.middleware) */
export interface AuthUser {
  id: string;
  email: string;
}

/** Express Request extended with optional authenticated user */
export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}
