import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useSessionValidator } from "../use-session-validator";
import { useAuth } from "../use-auth";
import { supabase } from "@/lib/supabase";

// Mock dependencies
vi.mock("../use-auth");
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

describe("useSessionValidator", () => {
  const mockSignOut = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Default mock implementation
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      signOut: mockSignOut,
      user: null,
      isLoading: false,
      isAdmin: false,
      signIn: vi.fn(),
    });

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: "test-user" },
          access_token: "test-token",
        } as any,
      },
      error: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("validates session on tab visibility change", async () => {
    const { result } = renderHook(() => useSessionValidator());

    // Simulate tab becoming visible
    Object.defineProperty(document, "visibilityState", {
      writable: true,
      configurable: true,
      value: "visible",
    });

    document.dispatchEvent(new Event("visibilitychange"));
    await vi.runAllTimersAsync();

    expect(supabase.auth.getSession).toHaveBeenCalled();
  });

  test("throttles validation calls (max once per 30 seconds)", async () => {
    renderHook(() => useSessionValidator());

    // First validation
    Object.defineProperty(document, "visibilityState", {
      writable: true,
      configurable: true,
      value: "visible",
    });

    document.dispatchEvent(new Event("visibilitychange"));
    await vi.runAllTimersAsync();

    expect(supabase.auth.getSession).toHaveBeenCalledTimes(1);

    // Advance time by 10 seconds (within throttle window)
    vi.advanceTimersByTime(10000);

    // Second validation attempt (should be throttled)
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.runAllTimersAsync();

    expect(supabase.auth.getSession).toHaveBeenCalledTimes(1); // Still 1

    // Advance time by 25 more seconds (total 35s, past throttle)
    vi.advanceTimersByTime(25000);

    // Third validation attempt (should succeed)
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.runAllTimersAsync();

    expect(supabase.auth.getSession).toHaveBeenCalledTimes(2); // Now 2
  });

  test("logs out on expired session (no session returned)", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    renderHook(() => useSessionValidator());

    Object.defineProperty(document, "visibilityState", {
      writable: true,
      configurable: true,
      value: "visible",
    });

    document.dispatchEvent(new Event("visibilitychange"));
    await vi.runAllTimersAsync();

    expect(mockSignOut).toHaveBeenCalled();
  });

  test("logs out on session validation error", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: { message: "Invalid session" } as any,
    });

    renderHook(() => useSessionValidator());

    Object.defineProperty(document, "visibilityState", {
      writable: true,
      configurable: true,
      value: "visible",
    });

    document.dispatchEvent(new Event("visibilitychange"));
    await vi.runAllTimersAsync();

    expect(mockSignOut).toHaveBeenCalled();
  });

  test("maintains session if valid (no logout)", async () => {
    renderHook(() => useSessionValidator());

    Object.defineProperty(document, "visibilityState", {
      writable: true,
      configurable: true,
      value: "visible",
    });

    document.dispatchEvent(new Event("visibilitychange"));
    await vi.runAllTimersAsync();

    expect(supabase.auth.getSession).toHaveBeenCalled();
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  test("does not validate when unauthenticated", async () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      signOut: mockSignOut,
      user: null,
      isLoading: false,
      isAdmin: false,
      signIn: vi.fn(),
    });

    renderHook(() => useSessionValidator());

    Object.defineProperty(document, "visibilityState", {
      writable: true,
      configurable: true,
      value: "visible",
    });

    document.dispatchEvent(new Event("visibilitychange"));

    await vi.runAllTimersAsync();

    expect(supabase.auth.getSession).not.toHaveBeenCalled();
  });

  test("handles network errors gracefully (no logout)", async () => {
    // Simulate network error by throwing
    vi.mocked(supabase.auth.getSession).mockRejectedValue(
      new Error("Network error")
    );

    renderHook(() => useSessionValidator());

    Object.defineProperty(document, "visibilityState", {
      writable: true,
      configurable: true,
      value: "visible",
    });

    document.dispatchEvent(new Event("visibilitychange"));
    await vi.runAllTimersAsync();

    expect(supabase.auth.getSession).toHaveBeenCalled();
    // Should NOT logout on network errors
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  test("cleans up event listener on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

    const { unmount } = renderHook(() => useSessionValidator());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "visibilitychange",
      expect.any(Function)
    );

    removeEventListenerSpy.mockRestore();
  });

  test("does not validate on tab hidden", async () => {
    renderHook(() => useSessionValidator());

    Object.defineProperty(document, "visibilityState", {
      writable: true,
      configurable: true,
      value: "hidden",
    });

    document.dispatchEvent(new Event("visibilitychange"));

    await vi.runAllTimersAsync();

    expect(supabase.auth.getSession).not.toHaveBeenCalled();
  });
});
