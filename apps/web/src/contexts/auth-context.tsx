"use client";

import {
  confirmPasswordReset,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { getFirebaseAuth } from "@/lib/firebase";
import { authService } from "@/services/auth/auth.service";
import {
  setApiTokenProvider,
  setApiUnauthorizedHandler,
} from "@/services/api/client";
import { authStore } from "@/stores/auth-store";
import type { MeUser, RegisterResponse } from "@/types/api";
import { ApiError, mapFirebaseError } from "@/utils/errors";

interface AuthContextValue {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: {
    full_name: string;
    email: string;
    password: string;
    password_confirm: string;
  }) => Promise<RegisterResponse>;
  signOutUser: () => Promise<void>;
  verifyAccount: (token: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resetPassword: (oobCode: string, password: string) => Promise<void>;
  refreshProfile: () => Promise<MeUser | null>;
  getIdToken: (force?: boolean) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function syncSessionCookie(idToken: string | null): Promise<void> {
  if (idToken) {
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    return;
  }
  await fetch("/api/auth/session", { method: "DELETE" });
}

async function establishApiSession(firebaseUser: FirebaseUser): Promise<MeUser> {
  const idToken = await firebaseUser.getIdToken();
  const login = await authService.login(idToken);
  await syncSessionCookie(idToken);
  authStore.setAuthenticated(login.user);
  return login.user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const initialized = useRef(false);
  const signingIn = useRef(false);

  const handleUnauthorized = useCallback(() => {
    void signOut(getFirebaseAuth());
    authStore.setUnauthenticated();
    void syncSessionCookie(null);
    router.replace("/login?reason=session_expired");
  }, [router]);

  useEffect(() => {
    setApiTokenProvider(async () => {
      const user = getFirebaseAuth().currentUser;
      if (!user) return null;
      return user.getIdToken();
    });
    setApiUnauthorizedHandler(handleUnauthorized);
  }, [handleUnauthorized]);

  useEffect(() => {
    const auth = getFirebaseAuth();
    authStore.setLoading();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        authStore.setUnauthenticated();
        await syncSessionCookie(null);
        initialized.current = true;
        return;
      }

      if (signingIn.current) {
        return;
      }

      try {
        const user = await establishApiSession(firebaseUser);
        authStore.setAuthenticated(user);
      } catch (error) {
        if (error instanceof ApiError && error.code === "account_not_verified") {
          authStore.setUnauthenticated();
          await syncSessionCookie(null);
          await signOut(auth);
          if (!initialized.current) {
            router.replace(
              `/verify-email?email=${encodeURIComponent(firebaseUser.email ?? "")}`,
            );
          }
        } else {
          authStore.setUnauthenticated();
          await syncSessionCookie(null);
        }
      } finally {
        initialized.current = true;
      }
    });

    const refreshInterval = window.setInterval(async () => {
      const user = getFirebaseAuth().currentUser;
      if (!user) return;
      try {
        const token = await user.getIdToken(true);
        await syncSessionCookie(token);
        const profile = await authService.me();
        authStore.updateUser(profile);
      } catch {
        /* handled on next API call */
      }
    }, 10 * 60 * 1000);

    return () => {
      unsubscribe();
      window.clearInterval(refreshInterval);
    };
  }, [router]);

  const signIn = useCallback(async (email: string, password: string) => {
    authStore.setLoading();
    signingIn.current = true;
    try {
      const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      await establishApiSession(credential.user);
      router.replace("/dashboard");
    } catch (error) {
      authStore.setUnauthenticated();
      await syncSessionCookie(null);
      if (error instanceof ApiError) {
        throw error;
      }
      if (error && typeof error === "object" && "code" in error) {
        throw new Error(mapFirebaseError(String((error as { code: string }).code)));
      }
      throw error;
    } finally {
      signingIn.current = false;
    }
  }, [router]);

  const signUp = useCallback(
    async (payload: {
      full_name: string;
      email: string;
      password: string;
      password_confirm: string;
    }) => {
      const response = await authService.register(payload);
      sessionStorage.setItem("econmesh_pending_email", payload.email);
      if (response.verification_token) {
        sessionStorage.setItem("econmesh_dev_verification_token", response.verification_token);
      }
      return response;
    },
    [],
  );

  const signOutUser = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      /* proceed with local sign-out */
    }
    await signOut(getFirebaseAuth());
    authStore.setUnauthenticated();
    await syncSessionCookie(null);
    router.replace("/login");
  }, [router]);

  const verifyAccount = useCallback(
    async (token: string) => {
      await authService.verify(token);
      sessionStorage.removeItem("econmesh_dev_verification_token");
    },
    [],
  );

  const resendVerification = useCallback(async (email: string) => {
    const response = await authService.resendVerification(email);
    const devToken = response.data?.verification_token;
    if (typeof devToken === "string") {
      sessionStorage.setItem("econmesh_dev_verification_token", devToken);
    }
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email, {
        url: `${window.location.origin}/reset-password`,
      });
    } catch (error) {
      if (error && typeof error === "object" && "code" in error) {
        throw new Error(mapFirebaseError(String((error as { code: string }).code)));
      }
      throw error;
    }
  }, []);

  const resetPassword = useCallback(async (oobCode: string, password: string) => {
    try {
      await confirmPasswordReset(getFirebaseAuth(), oobCode, password);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error) {
        throw new Error(mapFirebaseError(String((error as { code: string }).code)));
      }
      throw error;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const user = getFirebaseAuth().currentUser;
    if (!user) return null;
    const profile = await authService.me();
    authStore.updateUser(profile);
    return profile;
  }, []);

  const getIdToken = useCallback(async (force = false) => {
    const user = getFirebaseAuth().currentUser;
    if (!user) return null;
    return user.getIdToken(force);
  }, []);

  const value = useMemo(
    () => ({
      signIn,
      signUp,
      signOutUser,
      verifyAccount,
      resendVerification,
      sendPasswordReset,
      resetPassword,
      refreshProfile,
      getIdToken,
    }),
    [
      signIn,
      signUp,
      signOutUser,
      verifyAccount,
      resendVerification,
      sendPasswordReset,
      resetPassword,
      refreshProfile,
      getIdToken,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return ctx;
}
