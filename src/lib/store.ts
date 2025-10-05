import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Auth State
interface AuthState {
  user: Record<string, unknown> | null;
  isLoading: boolean;
  authError: string | null;
  setUser: (user: Record<string, unknown> | null) => void;
  setIsLoading: (loading: boolean) => void;
  setAuthError: (error: string | null) => void;
  logout: () => void;
}

/**
 * Auth Store - In-Memory Only
 *
 * Security: No localStorage persistence to prevent XSS attacks and state manipulation.
 * Session management is handled entirely by Supabase via httpOnly cookies.
 * User profile data is fetched from the database on page load via supabase.auth.getSession().
 */
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isLoading: true,
  authError: null,
  setUser: (user) => set({ user }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setAuthError: (error) => set({ authError: error }),
  logout: () => set({ user: null, authError: null }),
}));

// UI State
interface UIState {
  sidebarCollapsed: boolean;
  theme: "light" | "dark" | "system";
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: "system",
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "ui-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
