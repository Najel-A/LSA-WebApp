import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types';
import { userService } from './user.service';

/** GET /users/me — return current user (protected by auth middleware) */
export function getMe(req: AuthenticatedRequest, res: Response): void {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const me = userService.getMe(user.id);
  if (!me) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(me);
}
