/** In-memory user record (password hash stored; never returned) */
export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}
