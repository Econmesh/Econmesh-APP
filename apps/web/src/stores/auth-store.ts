import type { MeUser } from "@/types/api";

export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

type Listener = () => void;

interface AuthState {
  status: AuthStatus;
  user: MeUser | null;
}

let state: AuthState = {
  status: "idle",
  user: null,
};

const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export const authStore = {
  getState(): AuthState {
    return state;
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  setLoading() {
    state = { ...state, status: "loading" };
    emit();
  },

  setAuthenticated(user: MeUser) {
    state = { status: "authenticated", user };
    emit();
  },

  setUnauthenticated() {
    state = { status: "unauthenticated", user: null };
    emit();
  },

  updateUser(user: MeUser) {
    if (state.status === "authenticated") {
      state = { status: "authenticated", user };
      emit();
    }
  },
};
