import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { AUTH_STORAGE_KEY, AUTH_TOKEN_STORAGE_KEY } from "../constants/auth";
import { getCurrentUser, loginRequest } from "../services/auth";
import type { AuthUser } from "../types";

type LoginPayload = {
  identifier: string;
  password: string;
};

type LoginResult = { ok: true; user: AuthUser } | { ok: false; message: string };

type AuthContextValue = {
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<LoginResult>;
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
    if (!window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)) {
      return null;
    }

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

  useEffect(() => {
    if (!window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)) {
      return;
    }

    void getCurrentUser()
      .then(setUser)
      .catch(() => {
        window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
        setUser(null);
      });
  }, []);

  useEffect(() => {
    const handleAuthorizationError = (event: Event) => {
      if ((event as CustomEvent<number>).detail !== 401) {
        return;
      }

      window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      setUser(null);
    };

    window.addEventListener("riquisimo:authorization-error", handleAuthorizationError);
    return () => window.removeEventListener("riquisimo:authorization-error", handleAuthorizationError);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      isAuthenticated: Boolean(user),
      login: async ({ identifier, password }) => {
        const normalizedIdentifier = identifier.trim().toLowerCase();
        const normalizedPassword = password.trim();

        if (!normalizedIdentifier || !normalizedPassword) {
          return { ok: false, message: "Debe completar usuario y contraseña" };
        }

        try {
          const { token, user: nextUser } = await loginRequest(normalizedIdentifier, normalizedPassword);
          window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
          setUser(nextUser);
          return { ok: true, user: nextUser };
        } catch (error) {
          return { ok: false, message: error instanceof Error ? error.message : "No fue posible iniciar sesión" };
        }
      },
      logout: () => {
        window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
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
