import type { Response, NextFunction } from 'express';
import { authService } from './auth.service';
import type { AuthenticatedRequest } from '../types';

const BEARER = 'Bearer ';

/**
 * Verify JWT from Authorization: Bearer <token> and attach user to req.user.
 * Responds 401 if missing or invalid.
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith(BEARER)) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }
  const token = header.slice(BEARER.length);
  try {
    const payload = authService.verifyToken(token);
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
