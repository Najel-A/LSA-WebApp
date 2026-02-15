import { createSlice } from '@reduxjs/toolkit';

export type UserRole = 'user' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isBootstrapped: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isBootstrapped: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: { payload: { user: AuthUser; accessToken: string } }
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
    },
    setUser: (state, action: { payload: AuthUser }) => {
      state.user = action.payload;
      // does not overwrite accessToken
    },
    setRole: (state, action: { payload: UserRole }) => {
      if (state.user) state.user.role = action.payload;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.accessToken = null;
    },
    setBootstrapped: (state, action: { payload: boolean }) => {
      state.isBootstrapped = action.payload;
    },
  },
});

export const { setCredentials, setUser, setRole, clearCredentials, setBootstrapped } =
  authSlice.actions;
export default authSlice.reducer;
