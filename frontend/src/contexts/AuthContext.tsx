import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { getCurrentUser, loginRequest } from "../services/auth";
import { clearAuthSession, getAuthToken, readAuthUser, storeAuthSession, storeAuthUser } from "../services/authStorage";
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

function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(readAuthUser);

  useEffect(() => {
    storeAuthUser(user);
  }, [user]);

  useEffect(() => {
    if (!getAuthToken()) {
      return;
    }

    void getCurrentUser()
      .then(setUser)
      .catch(() => {
        clearAuthSession();
        setUser(null);
      });
  }, []);

  useEffect(() => {
    const handleAuthorizationError = (event: Event) => {
      if ((event as CustomEvent<number>).detail !== 401) {
        return;
      }

      clearAuthSession();
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
          storeAuthSession(token, nextUser);
          setUser(nextUser);
          return { ok: true, user: nextUser };
        } catch (error) {
          return { ok: false, message: error instanceof Error ? error.message : "No fue posible iniciar sesión" };
        }
      },
      logout: () => {
        clearAuthSession();
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
