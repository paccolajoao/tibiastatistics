"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { apiClient, configureApiClient, ApiError } from "@/lib/api-client";

type AuthResponse = {
  access_token: string;
  email: string;
};

type AuthContextValue = {
  email: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const accessTokenRef = useRef<string | null>(null);
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback((): Promise<string | null> => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const promise = (async () => {
      try {
        const data = await apiClient.post<AuthResponse>("/api/auth/refresh");
        accessTokenRef.current = data.access_token;
        setEmail(data.email);
        return data.access_token;
      } catch {
        accessTokenRef.current = null;
        setEmail(null);
        return null;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = promise;
    return promise;
  }, []);

  useEffect(() => {
    configureApiClient({
      getAccessToken: () => accessTokenRef.current,
      onUnauthorized: refresh,
    });
  }, [refresh]);

  useEffect(() => {
    async function bootstrap() {
      await refresh();
      setIsLoading(false);
    }
    bootstrap();
  }, [refresh]);

  const login = useCallback(async (loginEmail: string, password: string) => {
    const data = await apiClient.post<AuthResponse>("/api/auth/login", {
      email: loginEmail,
      password,
    });
    accessTokenRef.current = data.access_token;
    setEmail(data.email);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/api/auth/logout");
    } catch {
      // ignore network errors on logout
    }
    accessTokenRef.current = null;
    setEmail(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ email, isAuthenticated: email !== null, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

export { ApiError };
