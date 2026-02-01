import { Router } from 'express';
import { signup, login, logout } from './auth.controller';

export const authRoutes = Router();

authRoutes.post('/signup', signup);
authRoutes.post('/login', login);
authRoutes.post('/logout', logout);
