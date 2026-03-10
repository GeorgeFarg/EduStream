import { create } from "zustand";

interface LoginStore {
  token: string | null;
  email: string | null;
  isLoggedIn: boolean;
  setLogin: (token: string, email: string) => void;
  logout: () => void;
}

// Get initial state from localStorage
const getInitialState = () => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("email");
    return {
      token: token,
      email: email,
      isLoggedIn: !!token,
    };
  }
  return {
    token: null,
    email: null,
    isLoggedIn: false,
  };
};

export const useLoginStore = create<LoginStore>((set) => ({
  ...getInitialState(),
  setLogin: (token: string, email: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
      localStorage.setItem("email", email);
    }
    set({ token, email, isLoggedIn: true });
  },
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("email");
    }
    set({ token: null, email: null, isLoggedIn: false });
  },
}));
