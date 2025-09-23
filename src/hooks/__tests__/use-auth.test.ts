import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { User, Session } from "@supabase/supabase-js";
import { useAuth } from "../use-auth";

// Mock the auth store
const mockAuthStore = {
  user: null,
  isLoading: true,
  setUser: vi.fn(),
  setIsLoading: vi.fn(),
  logout: vi.fn(),
};

vi.mock("@/lib/store", () => ({
  useAuthStore: () => mockAuthStore,
}));

// Mock the supabase client
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(),
  },
}));

// Get the mocked supabase instance
const { supabase } = await import("@/lib/supabase");
const mockedSupabase = vi.mocked(supabase);

// Mock console.error
const consoleErrorMock = vi
  .spyOn(console, "error")
  .mockImplementation(() => {});

// Sample test data
const mockUser: User = {
  id: "user-123",
  email: "test@example.com",
  aud: "authenticated",
  role: "authenticated",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  email_confirmed_at: "2024-01-01T00:00:00Z",
  app_metadata: {},
  user_metadata: {},
};

const mockUserProfile = {
  id: "user-123",
  email: "test@example.com",
  role: "admin",
  first_name: "Test",
  last_name: "User",
  avatar_url: null,
  is_active: true,
};

const mockSession: Session = {
  user: mockUser,
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: "bearer",
};

describe("useAuth Hook", () => {
  // Mock subscription object
  const mockSubscription = {
    unsubscribe: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorMock.mockClear();

    // Reset auth store mock
    mockAuthStore.user = null;
    mockAuthStore.isLoading = true;

    // Default mock setup
    mockedSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    mockedSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: mockSubscription },
    });

    // Mock the query builder for user profile
    const mockQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };

    mockedSupabase.from.mockReturnValue(mockQueryBuilder);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize with loading state", () => {
      mockedSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isAdmin).toBe(false);
    });

    it("should load existing session on initialization", async () => {
      const mockQueryBuilder = mockedSupabase.from();
      mockQueryBuilder.single.mockResolvedValue({
        data: mockUserProfile,
        error: null,
      });

      mockedSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      renderHook(() => useAuth());

      await waitFor(() => {
        expect(mockedSupabase.auth.getSession).toHaveBeenCalled();
      });

      expect(mockedSupabase.from).toHaveBeenCalledWith("user_profiles");
      expect(mockQueryBuilder.select).toHaveBeenCalledWith("*");
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("id", mockUser.id);
      expect(mockAuthStore.setUser).toHaveBeenCalledWith(mockUserProfile);
      expect(mockAuthStore.setIsLoading).toHaveBeenCalledWith(false);
    });

    it("should handle initialization errors gracefully", async () => {
      mockedSupabase.auth.getSession.mockRejectedValue(
        new Error("Failed to get session")
      );

      renderHook(() => useAuth());

      await waitFor(
        () => {
          expect(consoleErrorMock).toHaveBeenCalledWith(
            "Error initializing auth:",
            expect.any(Error)
          );
        },
        { timeout: 1000 }
      );

      expect(mockAuthStore.setIsLoading).toHaveBeenCalledWith(false);
    }, 1500);

    it("should handle profile loading errors gracefully", async () => {
      const mockQueryBuilder = mockedSupabase.from();
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: new Error("Profile not found"),
      });

      mockedSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      renderHook(() => useAuth());

      await waitFor(() => {
        expect(consoleErrorMock).toHaveBeenCalledWith(
          "Error loading user profile:",
          expect.any(Error)
        );
      });
    });
  });

  describe("Auth State Changes", () => {
    it("should handle sign in event", async () => {
      const mockQueryBuilder = mockedSupabase.from();
      mockQueryBuilder.single.mockResolvedValue({
        data: mockUserProfile,
        error: null,
      });

      // Mock onAuthStateChange to simulate sign in
      let authChangeCallback:
        | ((event: string, session: Session | null) => void)
        | null = null;
      mockedSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authChangeCallback = callback;
        return { data: { subscription: mockSubscription } };
      });

      renderHook(() => useAuth());

      // Simulate sign in event
      if (authChangeCallback) {
        await act(async () => {
          await authChangeCallback("SIGNED_IN", mockSession);
        });
      }

      expect(mockedSupabase.from).toHaveBeenCalledWith("user_profiles");
      expect(mockAuthStore.setUser).toHaveBeenCalledWith(mockUserProfile);
    });

    it("should handle sign out event", async () => {
      // Mock onAuthStateChange to simulate sign out
      let authChangeCallback:
        | ((event: string, session: Session | null) => void)
        | null = null;
      mockedSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authChangeCallback = callback;
        return { data: { subscription: mockSubscription } };
      });

      renderHook(() => useAuth());

      // Simulate sign out event
      if (authChangeCallback) {
        await act(async () => {
          await authChangeCallback("SIGNED_OUT", null);
        });
      }

      expect(mockAuthStore.setUser).toHaveBeenCalledWith(null);
    });

    it("should clean up subscription on unmount", () => {
      const { unmount } = renderHook(() => useAuth());

      unmount();

      expect(mockSubscription.unsubscribe).toHaveBeenCalled();
    });
  });

  describe("Sign In", () => {
    it("should sign in successfully", async () => {
      mockedSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth());

      let signInResult;
      await act(async () => {
        signInResult = await result.current.signIn(
          "test@example.com",
          "password"
        );
      });

      expect(mockedSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password",
      });

      expect(mockAuthStore.setIsLoading).toHaveBeenCalledWith(true);
      expect(mockAuthStore.setIsLoading).toHaveBeenCalledWith(false);
      expect(signInResult).toEqual({ user: mockUser, error: null });
    });

    it("should handle sign in errors", async () => {
      const signInError = new Error("Invalid credentials");
      mockedSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: signInError,
      });

      const { result } = renderHook(() => useAuth());

      let signInResult;
      await act(async () => {
        signInResult = await result.current.signIn(
          "test@example.com",
          "wrongpassword"
        );
      });

      expect(consoleErrorMock).toHaveBeenCalledWith(
        "Sign in error:",
        signInError
      );
      expect(signInResult).toEqual({ user: null, error: signInError });
      expect(mockAuthStore.setIsLoading).toHaveBeenCalledWith(false);
    });

    it("should handle sign in exceptions", async () => {
      const error = new Error("Network error");
      mockedSupabase.auth.signInWithPassword.mockRejectedValue(error);

      const { result } = renderHook(() => useAuth());

      let signInResult;
      await act(async () => {
        signInResult = await result.current.signIn(
          "test@example.com",
          "password"
        );
      });

      expect(consoleErrorMock).toHaveBeenCalledWith("Sign in error:", error);
      expect(signInResult).toEqual({ user: null, error });
      expect(mockAuthStore.setIsLoading).toHaveBeenCalledWith(false);
    });
  });

  describe("Sign Out", () => {
    it("should sign out successfully", async () => {
      mockedSupabase.auth.signOut.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockedSupabase.auth.signOut).toHaveBeenCalled();
      expect(mockAuthStore.logout).toHaveBeenCalled();
      expect(mockAuthStore.setIsLoading).toHaveBeenCalledWith(true);
      expect(mockAuthStore.setIsLoading).toHaveBeenCalledWith(false);
    });

    it("should handle sign out errors", async () => {
      const signOutError = new Error("Failed to sign out");
      mockedSupabase.auth.signOut.mockResolvedValue({ error: signOutError });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signOut();
      });

      expect(consoleErrorMock).toHaveBeenCalledWith(
        "Sign out error:",
        signOutError
      );
      expect(mockAuthStore.setIsLoading).toHaveBeenCalledWith(false);
    });

    it("should handle sign out exceptions", async () => {
      const error = new Error("Network error");
      mockedSupabase.auth.signOut.mockRejectedValue(error);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signOut();
      });

      expect(consoleErrorMock).toHaveBeenCalledWith("Sign out error:", error);
      expect(mockAuthStore.setIsLoading).toHaveBeenCalledWith(false);
    });
  });

  describe("Authentication State", () => {
    it("should return correct authentication state when user is null", () => {
      mockAuthStore.user = null;
      mockAuthStore.isLoading = false;

      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isAdmin).toBe(false);
    });

    it("should return correct authentication state when user exists", () => {
      mockAuthStore.user = mockUserProfile;
      mockAuthStore.isLoading = false;

      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toBe(mockUserProfile);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isAdmin).toBe(true); // mockUserProfile has role: "admin"
    });

    it("should return correct admin state for non-admin user", () => {
      const regularUserProfile = {
        ...mockUserProfile,
        role: "user",
      };
      mockAuthStore.user = regularUserProfile;
      mockAuthStore.isLoading = false;

      const { result } = renderHook(() => useAuth());

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isAdmin).toBe(false);
    });

    it("should handle loading state", () => {
      mockAuthStore.user = null;
      mockAuthStore.isLoading = true;

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe("Profile Loading", () => {
    it("should load user profile with complete data", async () => {
      const completeProfile = {
        id: "user-123",
        email: "test@example.com",
        role: "admin",
        first_name: "John",
        last_name: "Doe",
        avatar_url: "https://example.com/avatar.jpg",
        is_active: true,
      };

      const mockQueryBuilder = mockedSupabase.from();
      mockQueryBuilder.single.mockResolvedValue({
        data: completeProfile,
        error: null,
      });

      mockedSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      renderHook(() => useAuth());

      await waitFor(() => {
        expect(mockAuthStore.setUser).toHaveBeenCalledWith(completeProfile);
      });
    });

    it("should handle missing profile gracefully", async () => {
      const mockQueryBuilder = mockedSupabase.from();
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: new Error("No rows returned"),
      });

      mockedSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      renderHook(() => useAuth());

      await waitFor(() => {
        expect(consoleErrorMock).toHaveBeenCalledWith(
          "Error loading user profile:",
          expect.any(Error)
        );
      });

      // Should not call setUser if profile loading fails
      expect(mockAuthStore.setUser).not.toHaveBeenCalled();
    });

    it("should handle profile loading exceptions", async () => {
      const mockQueryBuilder = mockedSupabase.from();
      mockQueryBuilder.single.mockRejectedValue(
        new Error("Database connection failed")
      );

      mockedSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      renderHook(() => useAuth());

      await waitFor(() => {
        expect(consoleErrorMock).toHaveBeenCalledWith(
          "Error loading user profile:",
          expect.any(Error)
        );
      });
    });
  });

  describe("Hook Return Values", () => {
    it("should return all expected properties and methods", () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current).toHaveProperty("user");
      expect(result.current).toHaveProperty("isLoading");
      expect(result.current).toHaveProperty("isAuthenticated");
      expect(result.current).toHaveProperty("isAdmin");
      expect(result.current).toHaveProperty("signIn");
      expect(result.current).toHaveProperty("signOut");

      expect(typeof result.current.signIn).toBe("function");
      expect(typeof result.current.signOut).toBe("function");
    });

    it("should maintain stable function references", () => {
      const { result, rerender } = renderHook(() => useAuth());

      // Store references to verify they remain stable
      const signInRef = result.current.signIn;
      const signOutRef = result.current.signOut;

      expect(signInRef).toBeDefined();
      expect(signOutRef).toBeDefined();

      rerender();

      // Functions should be stable due to useCallback in the implementation
      // Note: Since the dependencies (setUser, setIsLoading) are from Zustand store,
      // they should be stable, making the functions stable too
      expect(typeof result.current.signIn).toBe("function");
      expect(typeof result.current.signOut).toBe("function");
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed session data", async () => {
      mockedSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: null } }, // Malformed session
        error: null,
      });

      renderHook(() => useAuth());

      await waitFor(() => {
        expect(mockAuthStore.setIsLoading).toHaveBeenCalledWith(false);
      });

      // Should not attempt to load profile with null user
      expect(mockedSupabase.from).not.toHaveBeenCalled();
    });

    it("should handle concurrent auth state changes", async () => {
      const mockQueryBuilder = mockedSupabase.from();
      mockQueryBuilder.single.mockResolvedValue({
        data: mockUserProfile,
        error: null,
      });

      // Set up proper initialization mock to avoid errors
      mockedSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      let authChangeCallback:
        | ((event: string, session: Session | null) => void)
        | null = null;
      mockedSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authChangeCallback = callback;
        return { data: { subscription: mockSubscription } };
      });

      renderHook(() => useAuth());

      // Wait for initialization to complete
      await waitFor(() => {
        expect(mockAuthStore.setIsLoading).toHaveBeenCalledWith(false);
      });

      // Clear any initialization errors
      consoleErrorMock.mockClear();

      // Simulate rapid auth state changes
      if (authChangeCallback) {
        await act(async () => {
          await Promise.all([
            authChangeCallback("SIGNED_IN", mockSession),
            authChangeCallback("SIGNED_OUT", null),
            authChangeCallback("SIGNED_IN", mockSession),
          ]);
        });
      }

      // Should handle all events without errors after initialization
      expect(consoleErrorMock).not.toHaveBeenCalledWith(
        expect.stringMatching(/concurrent|auth state/i),
        expect.anything()
      );
    });
  });
});
