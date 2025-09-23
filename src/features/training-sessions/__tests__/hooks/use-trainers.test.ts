import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { ReactNode } from "react";
import {
  useTrainers,
  useTrainer,
  TRAINERS_KEYS,
} from "../../hooks/use-trainers";
import type { TrainerWithProfile } from "@/features/database/lib/types";

// Mock Supabase client with proper hoisting
vi.mock("@/lib/supabase", () => {
  const mockSupabase = {
    from: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    single: vi.fn(),
  };

  // Setup method chaining
  (mockSupabase.from as any).mockReturnValue(mockSupabase);
  (mockSupabase.select as any).mockReturnValue(mockSupabase);
  (mockSupabase.eq as any).mockReturnValue(mockSupabase);
  (mockSupabase.order as any).mockReturnValue(mockSupabase);
  (mockSupabase.single as any).mockReturnValue(mockSupabase);

  return {
    supabase: mockSupabase,
  };
});

// Get the mocked supabase
const { supabase } = await import("@/lib/supabase");
const mockedSupabase = vi.mocked(supabase);

// Test wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity, // Make data immediately fresh for reuse
        gcTime: Infinity, // Keep data in cache indefinitely
      },
      mutations: {
        retry: false,
      },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  return { Wrapper, queryClient };
}

describe("Trainers Hooks", () => {
  const mockTrainers: TrainerWithProfile[] = [
    {
      id: "trainer-1",
      user_id: "user-1",
      specialization: "strength",
      certification: "certified",
      hourly_rate: 75,
      status: "active",
      max_clients_per_session: 10,
      bio: "Experienced strength trainer",
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
      user_profile: {
        id: "profile-1",
        user_id: "user-1",
        first_name: "John",
        last_name: "Doe",
        date_of_birth: "1985-05-15",
        phone_number: "+1234567890",
        address: "123 Main St",
        city: "New York",
        state: "NY",
        zip_code: "10001",
        country: "USA",
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z",
      },
    },
    {
      id: "trainer-2",
      user_id: "user-2",
      specialization: "cardio",
      certification: "certified",
      hourly_rate: 60,
      status: "active",
      max_clients_per_session: 15,
      bio: "Cardio and endurance specialist",
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
      user_profile: {
        id: "profile-2",
        user_id: "user-2",
        first_name: "Jane",
        last_name: "Smith",
        date_of_birth: "1990-08-20",
        phone_number: "+1987654321",
        address: "456 Oak Ave",
        city: "Los Angeles",
        state: "CA",
        zip_code: "90210",
        country: "USA",
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z",
      },
    },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("useTrainers", () => {
    it("should fetch trainers successfully", async () => {
      const { Wrapper } = createWrapper();

      mockedSupabase.from.mockReturnValue(mockedSupabase);
      mockedSupabase.select.mockReturnValue(mockedSupabase);
      mockedSupabase.order.mockResolvedValue({
        data: mockTrainers,
        error: null,
      });

      const { result } = renderHook(() => useTrainers(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockTrainers);
      expect(mockedSupabase.from).toHaveBeenCalledWith("trainers");
      expect(mockedSupabase.select).toHaveBeenCalledWith(`
          *,
          user_profile:user_profiles(*)
        `);
      expect(mockedSupabase.order).toHaveBeenCalledWith(
        "user_profile.first_name",
        { ascending: true }
      );
    }, 1000);

    it("should handle fetch error", async () => {
      const { Wrapper } = createWrapper();

      const mockError = { message: "Database connection failed" };
      mockedSupabase.from.mockReturnValue(mockedSupabase);
      mockedSupabase.select.mockReturnValue(mockedSupabase);
      mockedSupabase.order.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const { result } = renderHook(() => useTrainers(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
      expect((result.current.error as Error).message).toBe(
        "Failed to fetch trainers: Database connection failed"
      );
    });

    it("should handle empty trainers list", async () => {
      const { Wrapper } = createWrapper();

      mockedSupabase.from.mockReturnValue(mockedSupabase);
      mockedSupabase.select.mockReturnValue(mockedSupabase);
      mockedSupabase.order.mockResolvedValue({
        data: [],
        error: null,
      });

      const { result } = renderHook(() => useTrainers(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    }, 1000);

    it("should use correct query key", () => {
      const expectedKey = TRAINERS_KEYS.list({});
      expect(expectedKey).toEqual(["trainers", "list", {}]);
    });

    it("should be in loading state initially", () => {
      const { Wrapper } = createWrapper();

      mockedSupabase.from.mockReturnValue(mockedSupabase);
      mockedSupabase.select.mockReturnValue(mockedSupabase);
      mockedSupabase.order.mockReturnValue(new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useTrainers(), { wrapper: Wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe("useTrainer", () => {
    const mockTrainer = mockTrainers[0];

    it("should fetch single trainer successfully", async () => {
      const { Wrapper } = createWrapper();

      mockedSupabase.from.mockReturnValue(mockedSupabase);
      mockedSupabase.select.mockReturnValue(mockedSupabase);
      mockedSupabase.eq.mockReturnValue(mockedSupabase);
      mockedSupabase.single.mockResolvedValue({
        data: mockTrainer,
        error: null,
      });

      const { result } = renderHook(() => useTrainer("trainer-1"), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockTrainer);
      expect(mockedSupabase.from).toHaveBeenCalledWith("trainers");
      expect(mockedSupabase.select).toHaveBeenCalledWith(`
          *,
          user_profile:user_profiles(*)
        `);
      expect(mockedSupabase.eq).toHaveBeenCalledWith("id", "trainer-1");
      expect(mockedSupabase.single).toHaveBeenCalled();
    });

    it("should handle fetch error for single trainer", async () => {
      const { Wrapper } = createWrapper();

      const mockError = { message: "Trainer not found" };
      mockedSupabase.from.mockReturnValue(mockedSupabase);
      mockedSupabase.select.mockReturnValue(mockedSupabase);
      mockedSupabase.eq.mockReturnValue(mockedSupabase);
      mockedSupabase.single.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const { result } = renderHook(() => useTrainer("trainer-1"), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect((result.current.error as Error).message).toBe(
        "Failed to fetch trainer: Trainer not found"
      );
    });

    it("should not fetch when id is empty", () => {
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useTrainer(""), { wrapper: Wrapper });

      expect(
        result.current.isPending && result.current.fetchStatus === "idle"
      ).toBe(true);
      expect(mockedSupabase.from).not.toHaveBeenCalled();
    });

    it("should not fetch when id is undefined", () => {
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useTrainer(undefined!), {
        wrapper: Wrapper,
      });

      expect(
        result.current.isPending && result.current.fetchStatus === "idle"
      ).toBe(true);
      expect(mockedSupabase.from).not.toHaveBeenCalled();
    });

    it("should use correct query key for single trainer", () => {
      const expectedKey = TRAINERS_KEYS.detail("trainer-1");
      expect(expectedKey).toEqual(["trainers", "detail", "trainer-1"]);
    });

    it("should refetch when trainer id changes", async () => {
      const { Wrapper } = createWrapper();

      mockedSupabase.from.mockReturnValue(mockedSupabase);
      mockedSupabase.select.mockReturnValue(mockedSupabase);
      mockedSupabase.eq.mockReturnValue(mockedSupabase);
      mockedSupabase.single.mockResolvedValue({
        data: mockTrainer,
        error: null,
      });

      const { result, rerender } = renderHook(
        (props: { id: string }) => useTrainer(props.id),
        {
          wrapper: Wrapper,
          initialProps: { id: "trainer-1" },
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockedSupabase.eq).toHaveBeenCalledWith("id", "trainer-1");

      // Change the trainer id
      rerender({ id: "trainer-2" });

      await waitFor(() => {
        expect(mockedSupabase.eq).toHaveBeenCalledWith("id", "trainer-2");
      });
    });
  });

  describe("Query Keys", () => {
    it("should generate correct query keys", () => {
      expect(TRAINERS_KEYS.all).toEqual(["trainers"]);
      expect(TRAINERS_KEYS.lists()).toEqual(["trainers", "list"]);
      expect(TRAINERS_KEYS.list({ status: "active" })).toEqual([
        "trainers",
        "list",
        { status: "active" },
      ]);
      expect(TRAINERS_KEYS.details()).toEqual(["trainers", "detail"]);
      expect(TRAINERS_KEYS.detail("trainer-1")).toEqual([
        "trainers",
        "detail",
        "trainer-1",
      ]);
    });

    it("should maintain query key consistency", () => {
      const filters = { specialization: "strength" };
      const key1 = TRAINERS_KEYS.list(filters);
      const key2 = TRAINERS_KEYS.list(filters);

      expect(key1).toEqual(key2);
      expect(JSON.stringify(key1)).toBe(JSON.stringify(key2));
    });
  });

  describe("Integration with QueryClient", () => {
    it("should use the same data for identical queries", async () => {
      const { Wrapper } = createWrapper();

      mockedSupabase.from.mockReturnValue(mockedSupabase);
      mockedSupabase.select.mockReturnValue(mockedSupabase);
      mockedSupabase.order.mockResolvedValue({
        data: mockTrainers,
        error: null,
      });

      // First hook instance
      const { result: result1 } = renderHook(() => useTrainers(), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
      });

      // Second hook instance with same query
      const { result: result2 } = renderHook(() => useTrainers(), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result2.current.isSuccess).toBe(true);
      });

      // Should have the same data reference (cached)
      expect(result1.current.data).toBe(result2.current.data);

      // Query should only have been called once due to caching
      expect(mockedSupabase.from).toHaveBeenCalledTimes(1);
    }, 1000);
  });

  describe("Error Handling", () => {
    it("should handle network errors gracefully", async () => {
      const { Wrapper } = createWrapper();

      mockedSupabase.from.mockReturnValue(mockedSupabase);
      mockedSupabase.select.mockReturnValue(mockedSupabase);
      mockedSupabase.order.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useTrainers(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect((result.current.error as Error).message).toBe("Network error");
    });

    it("should handle malformed response data", async () => {
      const { Wrapper } = createWrapper();

      mockedSupabase.from.mockReturnValue(mockedSupabase);
      mockedSupabase.select.mockReturnValue(mockedSupabase);
      mockedSupabase.order.mockResolvedValue({
        data: "invalid-data", // Should be an array
        error: null,
      });

      const { result } = renderHook(() => useTrainers(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Hook should still succeed but data might be unexpected
      expect(result.current.data).toBe("invalid-data");
    }, 1000);
  });
});
