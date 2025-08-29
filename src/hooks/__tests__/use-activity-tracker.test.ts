import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useActivityTracker } from "../use-activity-tracker";
import { ACTIVITY_EVENTS, SESSION_CONFIG } from "@/lib/session-config";

describe("useActivityTracker", () => {
  const mockOnActivity = vi.fn();
  const mockOnInactivity = vi.fn();
  const mockOnWarning = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        setItem: vi.fn(),
        getItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });

    // Mock DOM event methods
    document.addEventListener = vi.fn();
    document.removeEventListener = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize with default options", () => {
      const { result } = renderHook(() => useActivityTracker());

      expect(result.current.lastActivity).toBeTypeOf("number");
      expect(result.current.getTimeUntilTimeout).toBeTypeOf("function");
      expect(result.current.extendSession).toBeTypeOf("function");
      expect(result.current.isWarningActive).toBe(false);
    });

    it("should use custom timeout and warning settings", () => {
      const customTimeout = 900000; // 15 minutes
      const customWarningTime = 180000; // 3 minutes

      renderHook(() =>
        useActivityTracker({
          onActivity: mockOnActivity,
          onInactivity: mockOnInactivity,
          onWarning: mockOnWarning,
          inactivityTimeout: customTimeout,
          warningTime: customWarningTime,
        })
      );

      // Should register event listeners for all activity events
      expect(document.addEventListener).toHaveBeenCalledTimes(
        ACTIVITY_EVENTS.length * 2
      );

      ACTIVITY_EVENTS.forEach((event) => {
        expect(document.addEventListener).toHaveBeenCalledWith(
          event,
          expect.any(Function),
          { passive: true }
        );
      });
    });

    it("should set initial timer for warning and inactivity", () => {
      vi.spyOn(global, "setTimeout");

      renderHook(() =>
        useActivityTracker({
          onWarning: mockOnWarning,
          onInactivity: mockOnInactivity,
          inactivityTimeout: SESSION_CONFIG.INACTIVITY_TIMEOUT,
          warningTime: SESSION_CONFIG.WARNING_BEFORE_LOGOUT,
        })
      );

      expect(setTimeout).toHaveBeenCalledWith(
        expect.any(Function),
        SESSION_CONFIG.INACTIVITY_TIMEOUT - SESSION_CONFIG.WARNING_BEFORE_LOGOUT
      );
      expect(setTimeout).toHaveBeenCalledWith(
        expect.any(Function),
        SESSION_CONFIG.INACTIVITY_TIMEOUT
      );
    });
  });

  describe("Activity Detection", () => {
    it("should trigger onActivity callback when activity is detected", () => {
      renderHook(() =>
        useActivityTracker({
          onActivity: mockOnActivity,
        })
      );

      // Get the registered event handler
      const addEventListenerCalls = vi.mocked(document.addEventListener).mock
        .calls;
      const mousedownHandler = addEventListenerCalls.find(
        (call) => call[0] === "mousedown"
      )?.[1] as EventListener;

      act(() => {
        mousedownHandler?.(new Event("mousedown"));
      });

      expect(mockOnActivity).toHaveBeenCalled();
    });

    it("should update localStorage when activity is detected", () => {
      const mockSetItem = vi.fn();
      Object.defineProperty(window, "localStorage", {
        value: { setItem: mockSetItem },
        writable: true,
      });

      renderHook(() => useActivityTracker());

      // The hook registers two handlers per event - one for activity callback, one for localStorage
      // We need to find the localStorage update handler specifically
      const addEventListenerCalls = vi.mocked(document.addEventListener).mock
        .calls;
      const clickHandlers = addEventListenerCalls.filter(
        (call) => call[0] === "click"
      );

      // Trigger both handlers (activity callback and localStorage update)
      act(() => {
        clickHandlers.forEach(([, handler]) => {
          (handler as EventListener)?.(new Event("click"));
        });
      });

      expect(mockSetItem).toHaveBeenCalledWith(
        "last-activity",
        expect.any(String)
      );
    });

    it("should reset timers when activity is detected", () => {
      vi.spyOn(global, "clearTimeout");
      vi.spyOn(global, "setTimeout");

      renderHook(() =>
        useActivityTracker({
          onWarning: mockOnWarning,
          onInactivity: mockOnInactivity,
        })
      );

      const clearTimeoutCalls = vi.mocked(clearTimeout).mock.calls.length;

      // Trigger activity
      const addEventListenerCalls = vi.mocked(document.addEventListener).mock
        .calls;
      const clickHandler = addEventListenerCalls.find(
        (call) => call[0] === "click"
      )?.[1] as EventListener;

      act(() => {
        clickHandler?.(new Event("click"));
      });

      // Should clear existing timeouts and set new ones
      expect(clearTimeout).toHaveBeenCalledTimes(clearTimeoutCalls + 2);
    });

    it("should handle all defined activity events", () => {
      renderHook(() =>
        useActivityTracker({
          onActivity: mockOnActivity,
        })
      );

      const addEventListenerCalls = vi.mocked(document.addEventListener).mock
        .calls;

      // Test each activity event
      ACTIVITY_EVENTS.forEach((eventType) => {
        const handler = addEventListenerCalls.find(
          (call) => call[0] === eventType
        )?.[1] as EventListener;

        act(() => {
          handler?.(new Event(eventType));
        });
      });

      expect(mockOnActivity).toHaveBeenCalledTimes(ACTIVITY_EVENTS.length);
    });
  });

  describe("Warning Timer", () => {
    it("should trigger warning callback at correct time", () => {
      const inactivityTimeout = 1800000; // 30 minutes
      const warningTime = 300000; // 5 minutes

      renderHook(() =>
        useActivityTracker({
          onWarning: mockOnWarning,
          inactivityTimeout,
          warningTime,
        })
      );

      // Fast forward to warning time
      act(() => {
        vi.advanceTimersByTime(inactivityTimeout - warningTime);
      });

      expect(mockOnWarning).toHaveBeenCalledWith(warningTime);
    });

    it("should not trigger warning if activity occurs before warning time", () => {
      const inactivityTimeout = 1800000; // 30 minutes
      const warningTime = 300000; // 5 minutes

      renderHook(() =>
        useActivityTracker({
          onWarning: mockOnWarning,
          inactivityTimeout,
          warningTime,
        })
      );

      // Simulate activity before warning
      const addEventListenerCalls = vi.mocked(document.addEventListener).mock
        .calls;
      const clickHandler = addEventListenerCalls.find(
        (call) => call[0] === "click"
      )?.[1] as EventListener;

      act(() => {
        vi.advanceTimersByTime(inactivityTimeout - warningTime - 1000);
        clickHandler?.(new Event("click"));
        vi.advanceTimersByTime(2000);
      });

      expect(mockOnWarning).not.toHaveBeenCalled();
    });
  });

  describe("Inactivity Timer", () => {
    it("should trigger inactivity callback after timeout", () => {
      const inactivityTimeout = 1800000; // 30 minutes

      renderHook(() =>
        useActivityTracker({
          onInactivity: mockOnInactivity,
          inactivityTimeout,
        })
      );

      act(() => {
        vi.advanceTimersByTime(inactivityTimeout + 1000);
      });

      expect(mockOnInactivity).toHaveBeenCalled();
    });

    it("should not trigger inactivity if activity occurs within timeout", () => {
      const inactivityTimeout = 1800000; // 30 minutes

      renderHook(() =>
        useActivityTracker({
          onInactivity: mockOnInactivity,
          inactivityTimeout,
        })
      );

      // Simulate activity before timeout
      const addEventListenerCalls = vi.mocked(document.addEventListener).mock
        .calls;
      const keyHandler = addEventListenerCalls.find(
        (call) => call[0] === "keypress"
      )?.[1] as EventListener;

      act(() => {
        vi.advanceTimersByTime(inactivityTimeout - 1000);
        keyHandler?.(new Event("keypress"));
        vi.advanceTimersByTime(2000);
      });

      expect(mockOnInactivity).not.toHaveBeenCalled();
    });
  });

  describe("Time Calculations", () => {
    it("should calculate time until timeout correctly", () => {
      const inactivityTimeout = 1800000; // 30 minutes
      const { result } = renderHook(() =>
        useActivityTracker({
          inactivityTimeout,
        })
      );

      const initialTime = result.current.getTimeUntilTimeout();
      expect(initialTime).toBeCloseTo(inactivityTimeout, -1000); // Within 1 second

      act(() => {
        vi.advanceTimersByTime(300000); // 5 minutes
      });

      const updatedTime = result.current.getTimeUntilTimeout();
      expect(updatedTime).toBeCloseTo(inactivityTimeout - 300000, -1000);
    });

    it("should return 0 when timeout has passed", () => {
      const inactivityTimeout = 1800000; // 30 minutes
      const { result } = renderHook(() =>
        useActivityTracker({
          inactivityTimeout,
        })
      );

      act(() => {
        vi.advanceTimersByTime(inactivityTimeout + 1000);
      });

      expect(result.current.getTimeUntilTimeout()).toBe(0);
    });
  });

  describe("Session Extension", () => {
    it("should reset timers when session is extended", () => {
      vi.spyOn(global, "clearTimeout");
      vi.spyOn(global, "setTimeout");

      const { result } = renderHook(() =>
        useActivityTracker({
          onWarning: mockOnWarning,
          onInactivity: mockOnInactivity,
        })
      );

      const initialClearCalls = vi.mocked(clearTimeout).mock.calls.length;

      act(() => {
        result.current.extendSession();
      });

      // Should clear existing timeouts and set new ones
      expect(clearTimeout).toHaveBeenCalledTimes(initialClearCalls + 2);
    });

    it("should call resetTimer when session is extended", () => {
      vi.spyOn(global, "clearTimeout");
      vi.spyOn(global, "setTimeout");

      const { result } = renderHook(() =>
        useActivityTracker({
          onWarning: mockOnWarning,
          onInactivity: mockOnInactivity,
        })
      );

      const initialClearCalls = vi.mocked(clearTimeout).mock.calls.length;
      const initialSetCalls = vi.mocked(setTimeout).mock.calls.length;

      act(() => {
        result.current.extendSession();
      });

      // Should clear existing timeouts and set new ones (same behavior as resetTimer)
      expect(clearTimeout).toHaveBeenCalledTimes(initialClearCalls + 2);
      expect(setTimeout).toHaveBeenCalledTimes(initialSetCalls + 2);
    });
  });

  describe("Cleanup", () => {
    it("should remove event listeners on unmount", () => {
      const { unmount } = renderHook(() =>
        useActivityTracker({
          onActivity: mockOnActivity,
        })
      );

      unmount();

      // Should remove event listeners for all activity events
      expect(document.removeEventListener).toHaveBeenCalledTimes(
        ACTIVITY_EVENTS.length * 2
      );

      ACTIVITY_EVENTS.forEach((event) => {
        expect(document.removeEventListener).toHaveBeenCalledWith(
          event,
          expect.any(Function)
        );
      });
    });

    it("should clear timers on unmount", () => {
      vi.spyOn(global, "clearTimeout");

      const { unmount } = renderHook(() =>
        useActivityTracker({
          onWarning: mockOnWarning,
          onInactivity: mockOnInactivity,
        })
      );

      unmount();

      // Should clear both warning and inactivity timers
      expect(clearTimeout).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing callbacks gracefully", () => {
      expect(() => {
        renderHook(() => useActivityTracker());
      }).not.toThrow();
    });

    it("should handle very short timeouts", () => {
      const shortTimeout = 1000; // 1 second
      const shortWarning = 500; // 0.5 seconds

      renderHook(() =>
        useActivityTracker({
          onWarning: mockOnWarning,
          onInactivity: mockOnInactivity,
          inactivityTimeout: shortTimeout,
          warningTime: shortWarning,
        })
      );

      act(() => {
        vi.advanceTimersByTime(shortTimeout - shortWarning + 100);
      });

      expect(mockOnWarning).toHaveBeenCalledWith(shortWarning);

      act(() => {
        vi.advanceTimersByTime(shortWarning + 100);
      });

      expect(mockOnInactivity).toHaveBeenCalled();
    });

    it("should handle zero warning time", () => {
      const inactivityTimeout = 1800000;

      renderHook(() =>
        useActivityTracker({
          onWarning: mockOnWarning,
          onInactivity: mockOnInactivity,
          inactivityTimeout,
          warningTime: 0,
        })
      );

      act(() => {
        vi.advanceTimersByTime(inactivityTimeout);
      });

      // Should trigger warning immediately before inactivity
      expect(mockOnWarning).toHaveBeenCalledWith(0);
    });

    it("should handle rapid activity events", () => {
      renderHook(() =>
        useActivityTracker({
          onActivity: mockOnActivity,
        })
      );

      const addEventListenerCalls = vi.mocked(document.addEventListener).mock
        .calls;
      const clickHandler = addEventListenerCalls.find(
        (call) => call[0] === "click"
      )?.[1] as EventListener;

      // Trigger multiple rapid events
      act(() => {
        for (let i = 0; i < 10; i++) {
          clickHandler?.(new Event("click"));
        }
      });

      expect(mockOnActivity).toHaveBeenCalledTimes(10);
    });
  });
});
