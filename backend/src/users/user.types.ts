/** Public user shape returned by GET /users/me (no password) */
export interface PublicUser {
  id: string;
  email: string;
  createdAt: string; // ISO date
}
