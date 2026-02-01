import { api } from '@/services/api';
import type { RootState } from '@/app/store';
import type { AuthUser } from './authSlice';
import { setCredentials, clearCredentials } from './authSlice';

/** Login response from POST /auth/login */
interface LoginResponse {
  accessToken: string;
  user: { id: string; email: string };
}

/** Signup response from POST /auth/signup */
interface SignupResponse {
  ok?: boolean;
  accessToken?: string;
  user?: { id: string; email: string };
}

/** Me response from GET /users/me */
interface MeResponse {
  id: string;
  email: string;
  role?: string;
  createdAt?: string;
}

/** Logout response from POST /auth/logout */
interface LogoutResponse {
  ok: boolean;
}

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, { email: string; password: string }>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const user: AuthUser = { id: data.user.id, email: data.user.email };
          dispatch(setCredentials({ user, accessToken: data.accessToken }));
        } catch {
          // Error handled by mutation
        }
      },
    }),

    signup: builder.mutation<SignupResponse, { email: string; password: string }>({
      query: (body) => ({
        url: '/auth/signup',
        method: 'POST',
        body,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.accessToken && data.user) {
            const user: AuthUser = { id: data.user.id, email: data.user.email };
            dispatch(setCredentials({ user, accessToken: data.accessToken }));
          }
        } catch {
          // Error handled by mutation
        }
      },
    }),

    me: builder.query<MeResponse, void>({
      query: () => '/users/me',
      providesTags: ['Me'],
      async onQueryStarted(_arg, { dispatch, getState, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const token = (getState() as RootState).auth.accessToken;
          if (token) {
            const user: AuthUser = {
              id: data.id,
              email: data.email,
              role: data.role,
            };
            dispatch(setCredentials({ user, accessToken: token }));
          }
        } catch {
          // Error handled by query
        }
      },
    }),

    logout: builder.mutation<LogoutResponse, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(clearCredentials());
          dispatch(api.util.invalidateTags(['Me']));
        }
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useMeQuery,
  useLogoutMutation,
} = authApi;
