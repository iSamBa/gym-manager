import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { ReactNode } from "react";
import { useMembers, useMember, MEMBERS_KEYS } from "../../hooks/use-members";
import type { Member } from "@/features/database/lib/types";

// Mock Supabase client
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

vi.mock("@/lib/supabase", () => ({
  supabase: mockSupabase,
}));

// Test wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
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

describe("Members Hooks", () => {
  const mockMembers: Member[] = [
    {
      id: "member-1",
      user_id: "user-1",
      membership_id: "membership-1",
      first_name: "Alice",
      last_name: "Johnson",
      email: "alice@example.com",
      phone: "+1234567890",
      date_of_birth: "1992-03-15",
      gender: "female",
      address: "123 Elm St",
      city: "New York",
      state: "NY",
      zip_code: "10001",
      country: "USA",
      emergency_contact_name: "Bob Johnson",
      emergency_contact_phone: "+1987654321",
      emergency_contact_relationship: "spouse",
      status: "active",
      joined_date: "2024-01-01",
      profile_picture_url: null,
      notes: "Regular member",
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
    },
    {
      id: "member-2",
      user_id: "user-2",
      membership_id: "membership-2",
      first_name: "Bob",
      last_name: "Smith",
      email: "bob@example.com",
      phone: "+1111222333",
      date_of_birth: "1988-07-22",
      gender: "male",
      address: "456 Oak Ave",
      city: "Los Angeles",
      state: "CA",
      zip_code: "90210",
      country: "USA",
      emergency_contact_name: "Carol Smith",
      emergency_contact_phone: "+1444555666",
      emergency_contact_relationship: "spouse",
      status: "active",
      joined_date: "2024-02-01",
      profile_picture_url: null,
      notes: null,
      created_at: "2024-02-01T00:00:00.000Z",
      updated_at: "2024-02-01T00:00:00.000Z",
    },
    {
      id: "member-3",
      user_id: "user-3",
      membership_id: "membership-3",
      first_name: "Charlie",
      last_name: "Brown",
      email: "charlie@example.com",
      phone: "+1777888999",
      date_of_birth: "1985-11-10",
      gender: "male",
      address: "789 Pine Rd",
      city: "Chicago",
      state: "IL",
      zip_code: "60601",
      country: "USA",
      emergency_contact_name: "David Brown",
      emergency_contact_phone: "+1000111222",
      emergency_contact_relationship: "brother",
      status: "inactive",
      joined_date: "2023-12-01",
      profile_picture_url: null,
      notes: "Inactive member",
      created_at: "2023-12-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
    },
  ];

  const activeMembers = mockMembers.filter(
    (member) => member.status === "active"
  );

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("useMembers", () => {
    it("should fetch active members successfully", async () => {
      const { Wrapper } = createWrapper();

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.order.mockResolvedValue({
        data: activeMembers,
        error: null,
      });

      const { result } = renderHook(() => useMembers(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(activeMembers);
      expect(mockSupabase.from).toHaveBeenCalledWith("members");
      expect(mockSupabase.select).toHaveBeenCalledWith("*");
      expect(mockSupabase.eq).toHaveBeenCalledWith("status", "active");
      expect(mockSupabase.order).toHaveBeenCalledWith("first_name", {
        ascending: true,
      });
    });

    it("should handle fetch error", async () => {
      const { Wrapper } = createWrapper();

      const mockError = { message: "Database connection failed" };
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.order.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const { result } = renderHook(() => useMembers(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
      expect((result.current.error as Error).message).toBe(
        "Failed to fetch members: Database connection failed"
      );
    });

    it("should handle empty members list", async () => {
      const { Wrapper } = createWrapper();

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null,
      });

      const { result } = renderHook(() => useMembers(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it("should filter only active members", async () => {
      const { Wrapper } = createWrapper();

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.order.mockResolvedValue({
        data: activeMembers,
        error: null,
      });

      const { result } = renderHook(() => useMembers(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify that only active members are returned
      expect(
        result.current.data?.every((member) => member.status === "active")
      ).toBe(true);
      expect(result.current.data).toHaveLength(2); // Only 2 active members in mock data
    });

    it("should use correct query key", () => {
      const expectedKey = MEMBERS_KEYS.list({ status: "active" });
      expect(expectedKey).toEqual(["members", "list", { status: "active" }]);
    });

    it("should be in loading state initially", () => {
      const { Wrapper } = createWrapper();

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.order.mockReturnValue(new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useMembers(), { wrapper: Wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it("should sort members by first name", async () => {
      const { Wrapper } = createWrapper();

      // Mock sorted data as returned from database
      const sortedMembers = [
        { ...activeMembers[0], first_name: "Alice" },
        { ...activeMembers[1], first_name: "Zoe" },
      ];

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.order.mockResolvedValue({
        data: sortedMembers, // Database should return sorted data
        error: null,
      });

      const { result } = renderHook(() => useMembers(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSupabase.order).toHaveBeenCalledWith("first_name", {
        ascending: true,
      });
      expect(result.current.data?.[0].first_name).toBe("Alice");
      expect(result.current.data?.[1].first_name).toBe("Zoe");
    });
  });

  describe("useMember", () => {
    const mockMember = mockMembers[0];

    it("should fetch single member successfully", async () => {
      const { Wrapper } = createWrapper();

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValue({
        data: mockMember,
        error: null,
      });

      const { result } = renderHook(() => useMember("member-1"), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockMember);
      expect(mockSupabase.from).toHaveBeenCalledWith("members");
      expect(mockSupabase.select).toHaveBeenCalledWith("*");
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", "member-1");
      expect(mockSupabase.single).toHaveBeenCalled();
    });

    it("should handle fetch error for single member", async () => {
      const { Wrapper } = createWrapper();

      const mockError = { message: "Member not found" };
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const { result } = renderHook(() => useMember("member-1"), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect((result.current.error as Error).message).toBe(
        "Failed to fetch member: Member not found"
      );
    });

    it("should not fetch when id is empty", () => {
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useMember(""), { wrapper: Wrapper });

      expect(result.current.isIdle).toBe(true);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it("should not fetch when id is undefined", () => {
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useMember(undefined!), {
        wrapper: Wrapper,
      });

      expect(result.current.isIdle).toBe(true);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it("should use correct query key for single member", () => {
      const expectedKey = MEMBERS_KEYS.detail("member-1");
      expect(expectedKey).toEqual(["members", "detail", "member-1"]);
    });

    it("should refetch when member id changes", async () => {
      const { Wrapper } = createWrapper();

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValue({
        data: mockMember,
        error: null,
      });

      const { result, rerender } = renderHook(
        (props: { id: string }) => useMember(props.id),
        {
          wrapper: Wrapper,
          initialProps: { id: "member-1" },
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSupabase.eq).toHaveBeenCalledWith("id", "member-1");

      // Change the member id
      rerender({ id: "member-2" });

      await waitFor(() => {
        expect(mockSupabase.eq).toHaveBeenCalledWith("id", "member-2");
      });
    });

    it("should fetch inactive members if requested by id", async () => {
      const { Wrapper } = createWrapper();

      const inactiveMember = mockMembers[2]; // This member has status 'inactive'

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValue({
        data: inactiveMember,
        error: null,
      });

      const { result } = renderHook(() => useMember("member-3"), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(inactiveMember);
      expect(result.current.data?.status).toBe("inactive");
    });
  });

  describe("Query Keys", () => {
    it("should generate correct query keys", () => {
      expect(MEMBERS_KEYS.all).toEqual(["members"]);
      expect(MEMBERS_KEYS.lists()).toEqual(["members", "list"]);
      expect(MEMBERS_KEYS.list({ status: "active" })).toEqual([
        "members",
        "list",
        { status: "active" },
      ]);
      expect(MEMBERS_KEYS.details()).toEqual(["members", "detail"]);
      expect(MEMBERS_KEYS.detail("member-1")).toEqual([
        "members",
        "detail",
        "member-1",
      ]);
    });

    it("should maintain query key consistency", () => {
      const filters = { status: "active" };
      const key1 = MEMBERS_KEYS.list(filters);
      const key2 = MEMBERS_KEYS.list(filters);

      expect(key1).toEqual(key2);
      expect(JSON.stringify(key1)).toBe(JSON.stringify(key2));
    });

    it("should differentiate between different filters", () => {
      const activeKey = MEMBERS_KEYS.list({ status: "active" });
      const inactiveKey = MEMBERS_KEYS.list({ status: "inactive" });

      expect(activeKey).not.toEqual(inactiveKey);
    });
  });

  describe("Integration with QueryClient", () => {
    it("should use the same data for identical queries", async () => {
      const { Wrapper } = createWrapper();

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.order.mockResolvedValue({
        data: activeMembers,
        error: null,
      });

      // First hook instance
      const { result: result1 } = renderHook(() => useMembers(), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
      });

      // Second hook instance with same query
      const { result: result2 } = renderHook(() => useMembers(), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result2.current.isSuccess).toBe(true);
      });

      // Should have the same data reference (cached)
      expect(result1.current.data).toBe(result2.current.data);

      // Query should only have been called once due to caching
      expect(mockSupabase.from).toHaveBeenCalledTimes(1);
    });

    it("should handle concurrent requests for same member", async () => {
      const { Wrapper } = createWrapper();

      const member = mockMembers[0];

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValue({
        data: member,
        error: null,
      });

      // Two hooks requesting the same member
      const { result: result1 } = renderHook(() => useMember("member-1"), {
        wrapper: Wrapper,
      });
      const { result: result2 } = renderHook(() => useMember("member-1"), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
        expect(result2.current.isSuccess).toBe(true);
      });

      // Both should have the same data
      expect(result1.current.data).toEqual(member);
      expect(result2.current.data).toEqual(member);
      expect(result1.current.data).toBe(result2.current.data); // Same reference due to caching
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors gracefully", async () => {
      const { Wrapper } = createWrapper();

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.order.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useMembers(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect((result.current.error as Error).message).toBe("Network error");
    });

    it("should handle malformed response data", async () => {
      const { Wrapper } = createWrapper();

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.order.mockResolvedValue({
        data: "invalid-data", // Should be an array
        error: null,
      });

      const { result } = renderHook(() => useMembers(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Hook should still succeed but data might be unexpected
      expect(result.current.data).toBe("invalid-data");
    });

    it("should handle timeout scenarios", async () => {
      const { Wrapper } = createWrapper();

      // Mock a timeout scenario
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.order.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request timeout")), 100)
          )
      );

      const { result } = renderHook(() => useMembers(), { wrapper: Wrapper });

      await waitFor(
        () => {
          expect(result.current.isError).toBe(true);
        },
        { timeout: 1000 }
      );

      expect((result.current.error as Error).message).toBe("Request timeout");
    });
  });
});
