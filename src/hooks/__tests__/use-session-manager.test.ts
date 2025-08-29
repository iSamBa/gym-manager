import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSessionManager } from "../use-session-manager";
import { useAuth } from "../use-auth";
import { useActivityTracker } from "../use-activity-tracker";
import { SESSION_CONFIG } from "@/lib/session-config";

// Mock dependencies
vi.mock("../use-auth");
vi.mock("../use-activity-tracker");

const mockUseAuth = vi.mocked(useAuth);
const mockUseActivityTracker = vi.mocked(useActivityTracker);

describe("useSessionManager", () => {
  const mockSignOut = vi.fn();
  const mockExtendSession = vi.fn();
  const mockGetTimeUntilTimeout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Mock auth hook
    mockUseAuth.mockReturnValue({
      signOut: mockSignOut,
      isAuthenticated: true,
      user: { id: "1", email: "test@example.com" },
      isLoading: false,
      isAdmin: false,
      signIn: vi.fn(),
    });

    // Mock activity tracker
    mockUseActivityTracker.mockReturnValue({
      extendSession: mockExtendSession,
      getTimeUntilTimeout: mockGetTimeUntilTimeout,
      lastActivity: Date.now(),
      isWarningActive: false,
    });

    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });

    // Mock window functions
    window.dispatchEvent = vi.fn();
    window.addEventListener = vi.fn();
    window.removeEventListener = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize with default session state", () => {
      const { result } = renderHook(() => useSessionManager());

      expect(result.current.sessionState).toEqual({
        isWarningVisible: false,
        timeLeft: 0,
        isSessionExpired: false,
      });
    });

    it("should use default inactivity timeout when rememberMe is false", () => {
      renderHook(() => useSessionManager(false));

      expect(mockUseActivityTracker).toHaveBeenCalledWith({
        onActivity: expect.any(Function),
        onInactivity: expect.any(Function),
        onWarning: expect.any(Function),
        inactivityTimeout: SESSION_CONFIG.INACTIVITY_TIMEOUT,
        warningTime: SESSION_CONFIG.WARNING_BEFORE_LOGOUT,
      });
    });

    it("should use remember me timeout when rememberMe is true", () => {
      renderHook(() => useSessionManager(true));

      expect(mockUseActivityTracker).toHaveBeenCalledWith({
        onActivity: expect.any(Function),
        onInactivity: expect.any(Function),
        onWarning: expect.any(Function),
        inactivityTimeout: SESSION_CONFIG.REMEMBER_ME_DURATION,
        warningTime: SESSION_CONFIG.WARNING_BEFORE_LOGOUT,
      });
    });
  });

  describe("Session Warning", () => {
    it("should handle warning callback and update state", () => {
      const { result } = renderHook(() => useSessionManager());

      // Get the onWarning callback from the activity tracker mock call
      const onWarning = mockUseActivityTracker.mock.calls[0][0].onWarning;

      act(() => {
        onWarning?.(300000); // 5 minutes in milliseconds
      });

      expect(result.current.sessionState).toEqual({
        isWarningVisible: true,
        timeLeft: 300000,
        isSessionExpired: false,
      });

      expect(window.dispatchEvent).toHaveBeenCalledWith(
        new CustomEvent("session-warning", {
          detail: { timeLeft: 300000 },
        })
      );
    });

    it("should dismiss warning when dismissWarning is called", () => {
      const { result } = renderHook(() => useSessionManager());

      // First trigger a warning
      const onWarning = mockUseActivityTracker.mock.calls[0][0].onWarning;
      act(() => {
        onWarning?.(300000);
      });

      expect(result.current.sessionState.isWarningVisible).toBe(true);

      // Then dismiss it
      act(() => {
        result.current.dismissWarning();
      });

      expect(result.current.sessionState.isWarningVisible).toBe(false);
    });
  });

  describe("Session Activity", () => {
    it("should handle activity callback and reset warning state", () => {
      const { result } = renderHook(() => useSessionManager());

      // First set warning state
      const onWarning = mockUseActivityTracker.mock.calls[0][0].onWarning;
      act(() => {
        onWarning?.(300000);
      });

      expect(result.current.sessionState.isWarningVisible).toBe(true);

      // Then trigger activity
      const onActivity = mockUseActivityTracker.mock.calls[0][0].onActivity;
      act(() => {
        onActivity?.();
      });

      expect(result.current.sessionState).toEqual({
        isWarningVisible: false,
        timeLeft: 300000, // timeLeft persists
        isSessionExpired: false,
      });
    });
  });

  describe("Session Expiration", () => {
    it("should handle inactivity timeout and trigger sign out", async () => {
      const { result } = renderHook(() => useSessionManager());

      const onInactivity = mockUseActivityTracker.mock.calls[0][0].onInactivity;

      await act(async () => {
        await onInactivity?.();
        // Fast forward past the 1 second delay
        vi.advanceTimersByTime(1100);
      });

      expect(result.current.sessionState.isSessionExpired).toBe(true);

      expect(window.dispatchEvent).toHaveBeenCalledWith(
        new CustomEvent("session-expiring", {
          detail: { timeLeft: 0 },
        })
      );

      expect(mockSignOut).toHaveBeenCalled();
    });

    it("should dispatch session expiring event before sign out", async () => {
      const { result } = renderHook(() => useSessionManager());

      const onInactivity = mockUseActivityTracker.mock.calls[0][0].onInactivity;

      await act(async () => {
        await onInactivity?.();
      });

      expect(result.current.sessionState.isSessionExpired).toBe(true);
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        new CustomEvent("session-expiring", {
          detail: { timeLeft: 0 },
        })
      );
    });
  });

  describe("Manual Session Extension", () => {
    it("should extend session manually and reset warning state", () => {
      const { result } = renderHook(() => useSessionManager());

      // First set warning and expired state
      const onWarning = mockUseActivityTracker.mock.calls[0][0].onWarning;
      act(() => {
        onWarning?.(300000);
      });

      act(() => {
        result.current.sessionState.isSessionExpired = true;
      });

      // Then extend session manually
      act(() => {
        result.current.extendSession();
      });

      expect(mockExtendSession).toHaveBeenCalled();
      expect(result.current.sessionState).toEqual({
        isWarningVisible: false,
        timeLeft: 300000,
        isSessionExpired: false,
      });
    });
  });

  describe("Tab Focus Handling", () => {
    it("should add focus event listener when authenticated", () => {
      const mockGetItem = vi.fn().mockReturnValue(Date.now().toString());
      Object.defineProperty(window, "localStorage", {
        value: { getItem: mockGetItem },
        writable: true,
      });

      const { unmount } = renderHook(() => useSessionManager());

      expect(window.addEventListener).toHaveBeenCalledWith(
        "focus",
        expect.any(Function)
      );

      unmount();
      expect(window.removeEventListener).toHaveBeenCalledWith(
        "focus",
        expect.any(Function)
      );
    });

    it("should not add focus event listener when not authenticated", () => {
      mockUseAuth.mockReturnValue({
        signOut: mockSignOut,
        isAuthenticated: false,
        user: null,
        isLoading: false,
        isAdmin: false,
        signIn: vi.fn(),
      });

      vi.clearAllMocks(); // Clear previous calls

      renderHook(() => useSessionManager());

      // Should not add focus event listener when not authenticated
      expect(window.addEventListener).not.toHaveBeenCalledWith(
        "focus",
        expect.any(Function)
      );
    });

    it("should handle focus event with valid session time", () => {
      const mockGetItem = vi.fn().mockReturnValue(Date.now().toString());
      Object.defineProperty(window, "localStorage", {
        value: { getItem: mockGetItem },
        writable: true,
      });

      const { result } = renderHook(() => useSessionManager());

      // Get the focus handler
      const focusHandler = vi
        .mocked(window.addEventListener)
        .mock.calls.find((call) => call[0] === "focus")?.[1] as EventListener;

      act(() => {
        focusHandler?.(new Event("focus"));
      });

      // Should not trigger expiration with valid session time
      expect(result.current.sessionState.isSessionExpired).toBe(false);
      expect(mockGetItem).toHaveBeenCalledWith("last-activity");
    });

    it("should trigger inactivity when session has expired based on localStorage", () => {
      const mockGetItem = vi.fn();
      // Mock expired session (more than default timeout)
      const expiredTime = Date.now() - SESSION_CONFIG.INACTIVITY_TIMEOUT - 1000;
      mockGetItem.mockReturnValue(expiredTime.toString());

      Object.defineProperty(window, "localStorage", {
        value: { getItem: mockGetItem },
        writable: true,
      });

      const { result } = renderHook(() => useSessionManager());

      // Get the focus handler
      const focusHandler = vi
        .mocked(window.addEventListener)
        .mock.calls.find((call) => call[0] === "focus")?.[1] as EventListener;

      act(() => {
        focusHandler?.(new Event("focus"));
      });

      expect(result.current.sessionState.isSessionExpired).toBe(true);
    });

    it("should handle missing lastActivity from localStorage gracefully", () => {
      const mockGetItem = vi.fn().mockReturnValue(null);
      Object.defineProperty(window, "localStorage", {
        value: { getItem: mockGetItem },
        writable: true,
      });

      const { result } = renderHook(() => useSessionManager());

      // Get the focus handler
      const focusHandler = vi
        .mocked(window.addEventListener)
        .mock.calls.find((call) => call[0] === "focus")?.[1] as EventListener;

      act(() => {
        focusHandler?.(new Event("focus"));
      });

      // Should not trigger expiration when no lastActivity stored
      expect(result.current.sessionState.isSessionExpired).toBe(false);
      expect(mockGetItem).toHaveBeenCalledWith("last-activity");
    });
  });

  describe("Return Values", () => {
    it("should return expected interface", () => {
      mockGetTimeUntilTimeout.mockReturnValue(1500000);

      const { result } = renderHook(() => useSessionManager());

      expect(result.current).toEqual({
        sessionState: expect.objectContaining({
          isWarningVisible: expect.any(Boolean),
          timeLeft: expect.any(Number),
          isSessionExpired: expect.any(Boolean),
        }),
        extendSession: expect.any(Function),
        dismissWarning: expect.any(Function),
        getTimeUntilTimeout: mockGetTimeUntilTimeout,
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle activity tracker initialization errors gracefully", () => {
      mockUseActivityTracker.mockImplementation(() => {
        throw new Error("Activity tracker failed");
      });

      expect(() => {
        renderHook(() => useSessionManager());
      }).toThrow("Activity tracker failed");
    });

    it("should handle rapid state updates correctly", () => {
      const { result } = renderHook(() => useSessionManager());

      const onWarning = mockUseActivityTracker.mock.calls[0][0].onWarning;
      const onActivity = mockUseActivityTracker.mock.calls[0][0].onActivity;

      act(() => {
        onWarning?.(300000);
        onActivity?.();
        onWarning?.(200000);
        result.current.dismissWarning();
        result.current.extendSession();
      });

      expect(result.current.sessionState).toEqual({
        isWarningVisible: false,
        timeLeft: 200000,
        isSessionExpired: false,
      });
    });
  });
});
