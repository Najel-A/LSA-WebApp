import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, toUserRecord, type UserRecord } from '../users/user.model';
import type { AuthTokenResponse, LoginSignupResponse } from './auth.types';

const SALT_ROUNDS = 10;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'; // short-lived
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn('JWT_SECRET not set; auth will fail. Set it in .env');
}

/** Parse expiresIn string (e.g. "15m") to seconds for JWT and API response */
function expiresInSecondsFromString(exp: string): number {
  if (exp.endsWith('m')) return parseInt(exp, 10) * 60;
  if (exp.endsWith('h')) return parseInt(exp, 10) * 3600;
  return parseInt(exp, 10) || 900;
}

export const authService = {
  async signup(email: string, password: string): Promise<LoginSignupResponse> {
    const normalized = email.trim().toLowerCase();

    // Check if email already exists
    const existing = await User.findOne({ email: normalized });
    if (existing) {
      throw new Error('EMAIL_IN_USE');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      email: normalized,
      passwordHash,
    });

    const id = user._id.toString();
    return {
      ...this.issueToken(id, normalized),
      user: { id, email: normalized },
    };
  },

  async login(email: string, password: string): Promise<LoginSignupResponse> {
    const normalized = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalized });
    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const id = user._id.toString();
    return {
      ...this.issueToken(id, user.email),
      user: { id, email: user.email },
    };
  },

  issueToken(userId: string, email: string): AuthTokenResponse {
    if (!JWT_SECRET) throw new Error('JWT_SECRET not configured');
    const expiresInSeconds = expiresInSecondsFromString(JWT_EXPIRES_IN);
    const accessToken = jwt.sign(
      { sub: userId, email },
      JWT_SECRET,
      { expiresIn: expiresInSeconds }
    );
    return {
      accessToken,
      expiresIn: expiresInSecondsFromString(JWT_EXPIRES_IN),
    };
  },

  /** For middleware: verify JWT and return payload; throws if invalid */
  verifyToken(token: string): { id: string; email: string } {
    if (!JWT_SECRET) throw new Error('JWT_SECRET not configured');
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; email: string };
    return { id: decoded.sub, email: decoded.email };
  },

  /** Look up user by id (for GET /users/me). Returns null if not found. */
  async getUserById(id: string): Promise<UserRecord | null> {
    const user = await User.findById(id);
    if (!user) return null;
    return toUserRecord(user);
  },
};
