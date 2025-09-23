import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Hook that debounces a value, delaying updates until after the specified delay
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds (default: 300ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook that provides a debounced callback function
 * @param callback - The function to debounce
 * @param delay - The delay in milliseconds (default: 300ms)
 * @param deps - Dependency array for the callback
 * @returns A debounced version of the callback
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 300,
  deps: React.DependencyList = []
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        callback(...args);
        timeoutRef.current = null;
      }, delay);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [callback, delay, ...deps]
  ) as T;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Hook that tracks debouncing state (useful for showing loading indicators)
 * @param value - The value being debounced
 * @param delay - The delay in milliseconds
 * @returns Object containing debounced value and loading state
 */
export function useDebouncedState<T>(value: T, delay: number = 300) {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    setIsDebouncing(true);
    const timer = setTimeout(() => {
      setDebouncedValue(value);
      setIsDebouncing(false);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return {
    value: debouncedValue,
    isDebouncing: isDebouncing && value !== debouncedValue,
  };
}

/**
 * Hook for debouncing async operations (like API calls)
 * Automatically cancels previous requests when new ones are made
 * @param asyncFn - The async function to debounce
 * @param delay - The delay in milliseconds
 * @returns Object with debounced function and state
 */
export function useDebouncedAsync<
  T extends (...args: unknown[]) => Promise<unknown>,
>(asyncFn: T, delay: number = 300) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Set debounced execution
      timeoutRef.current = setTimeout(async () => {
        // Create new abort controller
        const newController = new AbortController();
        abortControllerRef.current = newController;

        setLoading(true);
        setError(null);

        try {
          const result = await asyncFn(...args);

          // Only update state if request wasn't aborted
          if (!newController.signal.aborted) {
            setLoading(false);
            abortControllerRef.current = null;
          }
          return result;
        } catch (err) {
          if (!newController.signal.aborted) {
            setError(err instanceof Error ? err : new Error("Unknown error"));
            setLoading(false);
            abortControllerRef.current = null;
          }
        }
      }, delay);
    },
    [asyncFn, delay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
    }
  }, []);

  return {
    execute: debouncedFn as T,
    loading,
    error,
    cancel,
  };
}
