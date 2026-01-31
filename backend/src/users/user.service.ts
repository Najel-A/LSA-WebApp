import { authService } from '../auth/auth.service';
import type { PublicUser } from './user.types';

/** Business logic for user operations. No HTTP here. */
export const userService = {
  getMe(userId: string): PublicUser | null {
    const record = authService.getUserById(userId);
    if (!record) return null;
    return {
      id: record.id,
      email: record.email,
      createdAt: record.createdAt.toISOString(),
    };
  },
};
