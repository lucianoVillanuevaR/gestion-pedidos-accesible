import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { AUTH_STORAGE_KEY, DEMO_USERS } from "../constants/auth";
import type { AuthUser } from "../types";

type LoginPayload = {
  identifier: string;
  password: string;
};

type LoginResult = { ok: true; user: AuthUser } | { ok: false; message: string };

type AuthContextValue = {
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => LoginResult;
  logout: () => void;
  user: AuthUser | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function isValidUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as AuthUser;
  return Boolean(
    candidate.email &&
    candidate.label &&
    candidate.username &&
    (candidate.role === "cajero" || candidate.role === "cocina" || candidate.role === "admin")
  );
}

function readStoredUser() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue);
    return isValidUser(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
}

function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!user) {
      window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }

    window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  }, [user]);

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      isAuthenticated: Boolean(user),
      login: ({ identifier, password }) => {
        const normalizedIdentifier = identifier.trim().toLowerCase();
        const normalizedPassword = password.trim();

        if (!normalizedIdentifier || !normalizedPassword) {
          return { ok: false, message: "Debe completar usuario y contraseña" };
        }

        const matchingUser = DEMO_USERS.find((candidate) => {
          return candidate.email === normalizedIdentifier || candidate.username === normalizedIdentifier;
        });

        if (!matchingUser || matchingUser.password !== normalizedPassword) {
          return { ok: false, message: "Usuario o contraseña incorrectos" };
        }

        const nextUser: AuthUser = {
          email: matchingUser.email,
          label: matchingUser.label,
          role: matchingUser.role,
          username: matchingUser.username
        };

        setUser(nextUser);
        return { ok: true, user: nextUser };
      },
      logout: () => {
        setUser(null);
      }
    };
  }, [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }

  return context;
}

export { AuthProvider, useAuthContext };
