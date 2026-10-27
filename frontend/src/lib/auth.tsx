import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, tokenStore } from "./api";
import type { User } from "./types";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: Record<string, string>) => Promise<User>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) return;
    try {
      setUser(await api.get<User>("/auth/me"));
    } catch {
      tokenStore.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signIn = (res: { access_token: string; user: User }) => {
    tokenStore.set(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const value: AuthState = {
    user,
    loading,
    refresh,
    login: async (email, password) => signIn(await api.post("/auth/login", { email, password })),
    register: async (data) => signIn(await api.post("/auth/register", data)),
    logout: () => {
      tokenStore.clear();
      setUser(null);
      window.location.assign("/");
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export function homeFor(user: User): string {
  return user.role === "super_admin" ? "/admin" : user.role === "owner" ? "/owner" : "/staff";
}
