import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// Create a test query client with optimized settings for testing
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries in tests
        gcTime: 0, // Disable garbage collection in tests
        staleTime: 0, // Make all queries immediately stale in tests
      },
      mutations: {
        retry: false, // Disable mutation retries in tests
      },
    },
  });
}

// Create a wrapper component for testing hooks with React Query
export function createQueryWrapper(queryClient?: QueryClient) {
  const client = queryClient || createTestQueryClient();

  // Return a wrapper function instead of JSX to avoid parsing issues
  return function QueryWrapper({ children }: { children: ReactNode }) {
    // Use React.createElement instead of JSX
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    return React.createElement(QueryClientProvider, { client }, children);
  };
}

// Utility to wait for queries to settle in tests
export async function waitForQueryToSettle() {
  // Simple timeout to allow async operations to complete
  await new Promise((resolve) => setTimeout(resolve, 10));
}
