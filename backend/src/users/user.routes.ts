import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import { getMe } from './user.controller';

export const userRoutes = Router();

// All user routes require a valid JWT
userRoutes.use(requireAuth);

userRoutes.get('/me', getMe);
