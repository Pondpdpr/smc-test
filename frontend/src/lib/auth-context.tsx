import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import * as authApi from '@/api/auth';
import { getToken, setToken, USER_STORAGE_KEY } from '@/lib/api-client';
import type { User } from '@/lib/types';

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // No "get current user" endpoint exists yet, so the last-known user is
  // cached alongside the token and trusted until a request 401s.
  useEffect(() => {
    const token = getToken();
    const cached = localStorage.getItem(USER_STORAGE_KEY);
    if (token && cached) {
      setUser(JSON.parse(cached));
    }
    setIsLoading(false);
  }, []);

  function persist(nextUser: User | null, token: string | null) {
    setUser(nextUser);
    setToken(token);
    if (nextUser) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }

  async function login(email: string, password: string) {
    const { user: signedInUser, token } = await authApi.signIn(email, password);
    persist(signedInUser, token);
  }

  async function register(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    // Sign-up deliberately returns no token - verification is required
    // before the account can sign in (see backend sign-in.command.ts).
    await authApi.signUp(input);
  }

  function logout() {
    persist(null, null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
