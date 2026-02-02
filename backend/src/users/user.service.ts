import { User } from './user.model';
import type { PublicUser } from './user.types';

/** Business logic for user operations. No HTTP here. */
export const userService = {
  async getMe(userId: string): Promise<PublicUser | null> {
    const user = await User.findById(userId);
    if (!user) return null;
    return {
      id: user._id.toString(),
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    };
  },
};
