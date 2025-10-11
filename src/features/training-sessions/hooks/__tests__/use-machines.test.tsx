import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMachines, useUpdateMachine, MACHINES_KEYS } from "../use-machines";
import { supabase } from "@/lib/supabase";
import type { Machine } from "../../lib/types";

// Mock Supabase
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

const mockMachines: Machine[] = [
  {
    id: "machine-1",
    machine_number: 1,
    name: "Machine 1",
    is_available: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "machine-2",
    machine_number: 2,
    name: "Machine 2",
    is_available: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "machine-3",
    machine_number: 3,
    name: "Machine 3",
    is_available: false,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
];

// Create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  // eslint-disable-next-line react/display-name
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useMachines", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches all machines", async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockResolvedValue({
      data: mockMachines,
      error: null,
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
      order: mockOrder,
    } as any);

    const { result } = renderHook(() => useMachines(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(3);
    expect(result.current.data?.[0].machine_number).toBe(1);
    expect(supabase.from).toHaveBeenCalledWith("machines");
    expect(mockSelect).toHaveBeenCalledWith("*");
  });

  it("filters available machines only", async () => {
    const availableMachines = mockMachines.filter((m) => m.is_available);

    const mockEq = vi.fn().mockResolvedValue({
      data: availableMachines,
      error: null,
    });
    const mockOrder = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnValue({
      order: mockOrder,
      eq: mockEq,
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    const { result } = renderHook(() => useMachines({ available_only: true }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    result.current.data?.forEach((machine) => {
      expect(machine.is_available).toBe(true);
    });
    expect(mockEq).toHaveBeenCalledWith("is_available", true);
  });

  it("handles fetch errors gracefully", async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Database error" },
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
      order: mockOrder,
    } as any);

    const { result } = renderHook(() => useMachines(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toContain("Failed to fetch machines");
  });

  it("generates correct query keys", () => {
    expect(MACHINES_KEYS.all).toEqual(["machines"]);
    expect(MACHINES_KEYS.lists()).toEqual(["machines", "list"]);
    expect(MACHINES_KEYS.list()).toEqual(["machines", "list", undefined]);
    expect(MACHINES_KEYS.list({ available_only: true })).toEqual([
      "machines",
      "list",
      { available_only: true },
    ]);
  });
});

describe("useUpdateMachine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates machine availability", async () => {
    const updatedMachine: Machine = {
      ...mockMachines[0],
      is_available: false,
    };

    const mockSingle = vi.fn().mockResolvedValue({
      data: updatedMachine,
      error: null,
    });
    const mockSelect = vi.fn().mockReturnValue({
      single: mockSingle,
    });
    const mockEq = vi.fn().mockReturnValue({
      select: mockSelect,
    });
    const mockUpdate = vi.fn().mockReturnValue({
      eq: mockEq,
    });

    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate,
    } as any);

    const { result } = renderHook(() => useUpdateMachine(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      id: "machine-1",
      data: { is_available: false },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(supabase.from).toHaveBeenCalledWith("machines");
    expect(mockUpdate).toHaveBeenCalledWith({ is_available: false });
    expect(mockEq).toHaveBeenCalledWith("id", "machine-1");
  });

  it("handles update errors gracefully", async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Update failed" },
    });
    const mockSelect = vi.fn().mockReturnValue({
      single: mockSingle,
    });
    const mockEq = vi.fn().mockReturnValue({
      select: mockSelect,
    });
    const mockUpdate = vi.fn().mockReturnValue({
      eq: mockEq,
    });

    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate,
    } as any);

    const { result } = renderHook(() => useUpdateMachine(), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        id: "machine-1",
        data: { is_available: false },
      })
    ).rejects.toThrow("Failed to update machine");
  });
});
