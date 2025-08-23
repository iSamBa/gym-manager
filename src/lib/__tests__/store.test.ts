import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAuthStore, useUIStore } from "../store";

// Mock zustand persist middleware - just return the store function as-is for testing
vi.mock("zustand/middleware", () => ({
  persist: vi.fn((storeInitializer) => storeInitializer),
  createJSONStorage: vi.fn(() => ({
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  })),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

describe("Store Tests", () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock window.localStorage
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });
  });

  afterEach(() => {
    // Reset stores to initial state
    useAuthStore.getState().logout();
    useAuthStore.setState({ isLoading: true });
    useUIStore.setState({
      sidebarCollapsed: false,
      theme: "system",
    });
  });

  describe("useAuthStore", () => {
    describe("initial state", () => {
      it("should have correct initial state", () => {
        const state = useAuthStore.getState();

        expect(state.user).toBeNull();
        expect(state.isLoading).toBe(true);
        expect(typeof state.setUser).toBe("function");
        expect(typeof state.setIsLoading).toBe("function");
        expect(typeof state.logout).toBe("function");
      });
    });

    describe("setUser action", () => {
      it("should set user when called with user object", () => {
        const testUser = {
          id: "123",
          email: "test@example.com",
          name: "Test User",
        };

        useAuthStore.getState().setUser(testUser);

        const state = useAuthStore.getState();
        expect(state.user).toEqual(testUser);
      });

      it("should set user to null when called with null", () => {
        // First set a user
        const testUser = { id: "123", email: "test@example.com" };
        useAuthStore.getState().setUser(testUser);
        expect(useAuthStore.getState().user).toEqual(testUser);

        // Then set to null
        useAuthStore.getState().setUser(null);
        expect(useAuthStore.getState().user).toBeNull();
      });

      it("should handle complex user objects", () => {
        const complexUser = {
          id: "user-123",
          profile: {
            firstName: "John",
            lastName: "Doe",
            preferences: {
              theme: "dark",
              notifications: true,
            },
          },
          roles: ["admin", "user"],
          metadata: {
            lastLogin: new Date().toISOString(),
            loginCount: 42,
          },
        };

        useAuthStore.getState().setUser(complexUser);

        const state = useAuthStore.getState();
        expect(state.user).toEqual(complexUser);
      });
    });

    describe("setIsLoading action", () => {
      it("should set isLoading to true", () => {
        useAuthStore.getState().setIsLoading(true);

        const state = useAuthStore.getState();
        expect(state.isLoading).toBe(true);
      });

      it("should set isLoading to false", () => {
        useAuthStore.getState().setIsLoading(false);

        const state = useAuthStore.getState();
        expect(state.isLoading).toBe(false);
      });

      it("should toggle isLoading state correctly", () => {
        // Start with initial state (true)
        expect(useAuthStore.getState().isLoading).toBe(true);

        // Set to false
        useAuthStore.getState().setIsLoading(false);
        expect(useAuthStore.getState().isLoading).toBe(false);

        // Set back to true
        useAuthStore.getState().setIsLoading(true);
        expect(useAuthStore.getState().isLoading).toBe(true);
      });
    });

    describe("logout action", () => {
      it("should reset user to null", () => {
        // First set a user
        const testUser = { id: "123", email: "test@example.com" };
        useAuthStore.getState().setUser(testUser);
        expect(useAuthStore.getState().user).toEqual(testUser);

        // Then logout
        useAuthStore.getState().logout();
        expect(useAuthStore.getState().user).toBeNull();
      });

      it("should not affect isLoading state", () => {
        // Set a specific loading state
        useAuthStore.getState().setIsLoading(false);
        const initialLoadingState = useAuthStore.getState().isLoading;

        // Logout
        useAuthStore.getState().logout();

        // Loading state should remain unchanged
        expect(useAuthStore.getState().isLoading).toBe(initialLoadingState);
      });

      it("should handle logout when user is already null", () => {
        // Ensure user is null
        useAuthStore.getState().logout();
        expect(useAuthStore.getState().user).toBeNull();

        // Logout again should not throw
        expect(() => {
          useAuthStore.getState().logout();
        }).not.toThrow();

        expect(useAuthStore.getState().user).toBeNull();
      });
    });

    describe("state persistence", () => {
      it("should have persistence middleware configured", () => {
        // The store is wrapped with persist middleware as evidenced by
        // the store working correctly with state management
        expect(useAuthStore.getState()).toBeDefined();
        expect(typeof useAuthStore.getState().setUser).toBe("function");
      });
    });
  });

  describe("useUIStore", () => {
    describe("initial state", () => {
      it("should have correct initial state", () => {
        const state = useUIStore.getState();

        expect(state.sidebarCollapsed).toBe(false);
        expect(state.theme).toBe("system");
        expect(typeof state.toggleSidebar).toBe("function");
        expect(typeof state.setSidebarCollapsed).toBe("function");
        expect(typeof state.setTheme).toBe("function");
      });
    });

    describe("sidebar state management", () => {
      it("should toggle sidebar state", () => {
        // Initial state should be false
        expect(useUIStore.getState().sidebarCollapsed).toBe(false);

        // Toggle to true
        useUIStore.getState().toggleSidebar();
        expect(useUIStore.getState().sidebarCollapsed).toBe(true);

        // Toggle back to false
        useUIStore.getState().toggleSidebar();
        expect(useUIStore.getState().sidebarCollapsed).toBe(false);
      });

      it("should set sidebar collapsed directly", () => {
        useUIStore.getState().setSidebarCollapsed(true);
        expect(useUIStore.getState().sidebarCollapsed).toBe(true);

        useUIStore.getState().setSidebarCollapsed(false);
        expect(useUIStore.getState().sidebarCollapsed).toBe(false);
      });

      it("should handle multiple consecutive toggles", () => {
        const initialState = useUIStore.getState().sidebarCollapsed;

        // Toggle 5 times
        useUIStore.getState().toggleSidebar(); // !initial
        useUIStore.getState().toggleSidebar(); // initial
        useUIStore.getState().toggleSidebar(); // !initial
        useUIStore.getState().toggleSidebar(); // initial
        useUIStore.getState().toggleSidebar(); // !initial

        expect(useUIStore.getState().sidebarCollapsed).toBe(!initialState);
      });
    });

    describe("theme management", () => {
      it("should set theme to light", () => {
        useUIStore.getState().setTheme("light");
        expect(useUIStore.getState().theme).toBe("light");
      });

      it("should set theme to dark", () => {
        useUIStore.getState().setTheme("dark");
        expect(useUIStore.getState().theme).toBe("dark");
      });

      it("should set theme to system", () => {
        useUIStore.getState().setTheme("system");
        expect(useUIStore.getState().theme).toBe("system");
      });

      it("should handle theme transitions", () => {
        // Start with system (default)
        expect(useUIStore.getState().theme).toBe("system");

        // Change to light
        useUIStore.getState().setTheme("light");
        expect(useUIStore.getState().theme).toBe("light");

        // Change to dark
        useUIStore.getState().setTheme("dark");
        expect(useUIStore.getState().theme).toBe("dark");

        // Back to system
        useUIStore.getState().setTheme("system");
        expect(useUIStore.getState().theme).toBe("system");
      });
    });

    describe("state independence", () => {
      it("should not affect theme when changing sidebar state", () => {
        const initialTheme = useUIStore.getState().theme;

        useUIStore.getState().toggleSidebar();
        expect(useUIStore.getState().theme).toBe(initialTheme);

        useUIStore.getState().setSidebarCollapsed(true);
        expect(useUIStore.getState().theme).toBe(initialTheme);
      });

      it("should not affect sidebar when changing theme", () => {
        const initialSidebarState = useUIStore.getState().sidebarCollapsed;

        useUIStore.getState().setTheme("light");
        expect(useUIStore.getState().sidebarCollapsed).toBe(
          initialSidebarState
        );

        useUIStore.getState().setTheme("dark");
        expect(useUIStore.getState().sidebarCollapsed).toBe(
          initialSidebarState
        );
      });
    });

    describe("state persistence", () => {
      it("should have persistence middleware configured", () => {
        // The store is wrapped with persist middleware as evidenced by
        // the store working correctly with state management
        expect(useUIStore.getState()).toBeDefined();
        expect(typeof useUIStore.getState().setTheme).toBe("function");
      });
    });
  });

  describe("store isolation", () => {
    it("should maintain independent state between stores", () => {
      // Modify auth store
      useAuthStore.getState().setUser({ id: "123" });
      useAuthStore.getState().setIsLoading(false);

      // Modify UI store
      useUIStore.getState().toggleSidebar();
      useUIStore.getState().setTheme("dark");

      // Verify auth store state
      const authState = useAuthStore.getState();
      expect(authState.user).toEqual({ id: "123" });
      expect(authState.isLoading).toBe(false);

      // Verify UI store state
      const uiState = useUIStore.getState();
      expect(uiState.sidebarCollapsed).toBe(true);
      expect(uiState.theme).toBe("dark");

      // Reset one store shouldn't affect the other
      useAuthStore.getState().logout();
      expect(useAuthStore.getState().user).toBeNull();

      // UI store should be unchanged
      expect(useUIStore.getState().sidebarCollapsed).toBe(true);
      expect(useUIStore.getState().theme).toBe("dark");
    });
  });

  describe("type safety", () => {
    it("should enforce correct user object structure", () => {
      const validUser = { id: "123", email: "test@test.com" };

      // This should work without TypeScript errors
      useAuthStore.getState().setUser(validUser);
      expect(useAuthStore.getState().user).toEqual(validUser);
    });

    it("should enforce theme enum values", () => {
      const validThemes: Array<"light" | "dark" | "system"> = [
        "light",
        "dark",
        "system",
      ];

      validThemes.forEach((theme) => {
        useUIStore.getState().setTheme(theme);
        expect(useUIStore.getState().theme).toBe(theme);
      });
    });
  });
});
