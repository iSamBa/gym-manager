/**
 * Auto-Inactivation Hooks Tests
 * Tests for React hooks managing auto-inactivation
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useInactivationCandidates,
  useRunAutoInactivation,
  useReactivateMember,
} from "../use-auto-inactivation";
import * as autoInactivationUtils from "../../lib/auto-inactivation-utils";

// Mock utilities
vi.mock("../../lib/auto-inactivation-utils");

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Helper to create wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("use-auto-inactivation hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useInactivationCandidates", () => {
    it("fetches inactivation candidates", async () => {
      const mockCandidates = [
        {
          member_id: "id-1",
          member_name: "John Doe",
          last_session_date: "2025-04-01",
          days_inactive: 200,
        },
      ];

      vi.mocked(
        autoInactivationUtils.getInactivationCandidates
      ).mockResolvedValue(mockCandidates);

      const { result } = renderHook(() => useInactivationCandidates(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockCandidates);
      expect(
        autoInactivationUtils.getInactivationCandidates
      ).toHaveBeenCalled();
    });

    it("handles errors", async () => {
      vi.mocked(
        autoInactivationUtils.getInactivationCandidates
      ).mockRejectedValue(new Error("Database error"));

      const { result } = renderHook(() => useInactivationCandidates(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });
  });

  describe("useRunAutoInactivation", () => {
    it("runs auto-inactivation successfully", async () => {
      const mockResult = {
        inactivated_count: 3,
        member_ids: ["id-1", "id-2", "id-3"],
        member_names: ["John", "Jane", "Bob"],
      };

      vi.mocked(autoInactivationUtils.runAutoInactivation).mockResolvedValue(
        mockResult
      );

      const { result } = renderHook(() => useRunAutoInactivation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(autoInactivationUtils.runAutoInactivation).toHaveBeenCalled();
    });

    it("handles errors with toast notification", async () => {
      vi.mocked(autoInactivationUtils.runAutoInactivation).mockRejectedValue(
        new Error("Database error")
      );

      const { result } = renderHook(() => useRunAutoInactivation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });
  });

  describe("useReactivateMember", () => {
    it("reactivates member successfully", async () => {
      vi.mocked(autoInactivationUtils.reactivateMember).mockResolvedValue(
        undefined
      );

      const { result } = renderHook(() => useReactivateMember(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        memberId: "member-123",
        adminName: "Admin User",
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(autoInactivationUtils.reactivateMember).toHaveBeenCalledWith(
        "member-123",
        "Admin User"
      );
    });

    it("handles errors with toast notification", async () => {
      vi.mocked(autoInactivationUtils.reactivateMember).mockRejectedValue(
        new Error("Update failed")
      );

      const { result } = renderHook(() => useReactivateMember(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        memberId: "member-123",
        adminName: "Admin User",
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });
  });
});
