import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { vi } from "vitest";

// Create a test query client with timer-safe and immediate resolution settings
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries in tests
        retryDelay: 0, // No delay between retries
        gcTime: 0, // Disable garbage collection in tests
        staleTime: 0, // Make all queries immediately stale in tests
        refetchOnMount: false, // Prevent automatic refetching
        refetchOnWindowFocus: false, // Prevent focus refetching
        refetchOnReconnect: false, // Prevent reconnect refetching
        networkMode: "always", // Always execute queries regardless of network status
      },
      mutations: {
        retry: false, // Disable mutation retries in tests
        networkMode: "always", // Always execute mutations
      },
    },
  });
}

// Create a wrapper component for testing hooks with React Query
export function createQueryWrapper(queryClient?: QueryClient) {
  const client = queryClient || createTestQueryClient();

  // Return a wrapper function using createElement to avoid JSX parsing issues
  return function QueryWrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client }, children);
  };
}

// Mock query response for immediate resolution
export function mockQueryResponse<T>(
  data: T,
  options?: { error?: Error; delay?: number }
) {
  if (options?.error) {
    return Promise.reject(options.error);
  }

  const delay = options?.delay ?? 0;
  return new Promise<T>((resolve) => {
    if (delay > 0) {
      setTimeout(() => resolve(data), delay);
    } else {
      resolve(data);
    }
  });
}

// Comprehensive query cleanup for tests
export function cleanupQueries(queryClient?: QueryClient) {
  if (queryClient) {
    queryClient.clear();
    queryClient.removeQueries();
    queryClient.cancelQueries();
  }
}

// Timer-safe utility for waiting in tests
export async function waitForQueryToSettle(ms: number = 0) {
  // Use vi.advanceTimersByTime if fake timers are active, otherwise use real timeout
  if (vi.isFakeTimers()) {
    vi.advanceTimersByTime(ms);
    // Flush any pending promises
    await vi.runAllTimersAsync();
  } else {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Utility for handling async operations in tests with fake timers
export async function flushPromises() {
  return new Promise((resolve) => setImmediate(resolve));
}
