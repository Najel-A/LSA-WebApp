/** Request body for POST /auth/signup */
export interface SignupBody {
  email: string;
  password: string;
}

/** Request body for POST /auth/login */
export interface LoginBody {
  email: string;
  password: string;
}

/** Response shape for signup/login — JWT access token */
export interface AuthTokenResponse {
  accessToken: string;
  expiresIn: number; // seconds
}
