import type { Request, Response } from 'express';
import { authService } from './auth.service';
import type { SignupBody, LoginBody } from './auth.types';

/** POST /auth/signup — create user and return JWT */
export async function signup(req: Request<object, unknown, SignupBody>, res: Response): Promise<void> {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'email and password required' });
    return;
  }
  try {
    const result = await authService.signup(email, password);
    res.status(201).json(result);
  } catch (e) {
    if ((e as Error).message === 'EMAIL_IN_USE') {
      res.status(409).json({ error: 'Email already in use' });
      return;
    }
    throw e;
  }
}

/** POST /auth/login — validate credentials and return JWT */
export async function login(req: Request<object, unknown, LoginBody>, res: Response): Promise<void> {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'email and password required' });
    return;
  }
  try {
    const result = await authService.login(email, password);
    res.json(result);
  } catch (e) {
    if ((e as Error).message === 'INVALID_CREDENTIALS') {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    throw e;
  }
}
