import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useDebounce,
  useDebouncedCallback,
  useDebouncedState,
  useDebouncedAsync,
} from "../use-debounce";

// Mock timers
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe("useDebounce", () => {
  it("should return initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("initial", 300));
    expect(result.current).toBe("initial");
  });

  it("should debounce value changes", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "initial", delay: 300 } }
    );

    expect(result.current).toBe("initial");

    // Update value
    rerender({ value: "updated", delay: 300 });
    expect(result.current).toBe("initial"); // Should still be initial

    // Fast forward time but not enough
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe("initial");

    // Fast forward past debounce delay
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe("updated");
  });

  it("should reset timer on rapid changes", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: "initial" } }
    );

    // Rapid updates
    rerender({ value: "update1" });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender({ value: "update2" });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender({ value: "final" });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Should still be initial
    expect(result.current).toBe("initial");

    // Now wait for full delay
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe("final");
  });
});

describe("useDebouncedCallback", () => {
  it("should debounce callback execution", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    // Call multiple times rapidly
    act(() => {
      result.current("arg1");
      result.current("arg2");
      result.current("arg3");
    });

    // Should not have called yet
    expect(callback).not.toHaveBeenCalled();

    // Fast forward time
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should have called once with latest args
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("arg3");
  });

  it("should cancel previous calls on rapid execution", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    act(() => {
      result.current("first");
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    act(() => {
      result.current("second");
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Should not have called first
    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Should have called with second only
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("second");
  });
});

describe("useDebouncedState", () => {
  it("should track debouncing state correctly", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedState(value, 300),
      { initialProps: { value: "initial" } }
    );

    // Initially should not be debouncing
    expect(result.current.value).toBe("initial");
    expect(result.current.isDebouncing).toBe(false);

    // Update value
    rerender({ value: "updated" });

    // Should be debouncing now
    expect(result.current.value).toBe("initial");
    expect(result.current.isDebouncing).toBe(true);

    // After delay, should have updated value and not be debouncing
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.value).toBe("updated");
    expect(result.current.isDebouncing).toBe(false);
  });
});

describe("useDebouncedAsync", () => {
  it("should debounce async function calls", () => {
    const asyncFn = vi.fn().mockResolvedValue("result");
    const { result } = renderHook(() => useDebouncedAsync(asyncFn, 300));

    // Multiple rapid calls
    act(() => {
      result.current.execute("arg1");
      result.current.execute("arg2");
      result.current.execute("arg3");
    });

    // Should not have called yet
    expect(asyncFn).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);

    // Fast forward time
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should be loading now and have called once
    expect(result.current.loading).toBe(true);
    expect(asyncFn).toHaveBeenCalledTimes(1);
    expect(asyncFn).toHaveBeenCalledWith("arg3");
  });

  it("should allow cancellation", () => {
    const asyncFn = vi.fn().mockResolvedValue("result");
    const { result } = renderHook(() => useDebouncedAsync(asyncFn, 300));

    act(() => {
      result.current.execute("arg");
    });

    // Cancel before execution
    act(() => {
      result.current.cancel();
    });

    // Fast forward time
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should not have called the function
    expect(asyncFn).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });
});
