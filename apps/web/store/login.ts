import { create } from "zustand";

/*
Session-based login workflow:

- Token/auth info is *not* stored in localStorage.
- Authentication state is determined by the presence of a session cookie, managed server-side (via httpOnly cookie).
- Client can "optimistically" track login UI state for client-side navigation, but 'real' auth is enforced server-side.
- For SSR routes, redirects happen if session is missing. For client, logout clears optimistic state (if any), and can trigger a reload to refresh session validation.

This store now only tracks local login UI state (optimistic). "Session" is not managed in localStorage!

*/

interface LoginStore {
  isLoggedIn: boolean;
  setLogin: (token: string) => void;
  logout: () => void;
}

// Helper that (optionally) checks for the session cookie in browser
const hasSession = () => {
  if (typeof document === "undefined") {
    return false;
  }
  return document.cookie.split(";").some((pair) => pair.trim().startsWith("session="));
};

// Get initial state
const getInitialState = () => ({
  isLoggedIn: typeof document !== "undefined" ? hasSession() : false,
});

export const useLoginStore = create<LoginStore>((set) => ({
  ...getInitialState(),

  // setLogin: can be called after API login to optimistically update state/UI
  setLogin: (token: string) => {
    // cookieStore.set('session', token)
    set({ isLoggedIn: true });
  },

  // logout: client-side, removes optimistic state and can trigger reload (session cookie will be cleared by the server endpoint)
  logout: () => {
    set({ isLoggedIn: false });
    if (typeof window !== "undefined") {
      // Optionally: force reload to update session validation across app
      window.location.reload();
    }
  },
}));
