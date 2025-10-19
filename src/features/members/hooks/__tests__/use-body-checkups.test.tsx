/**
 * Body Checkups Hook Tests
 * Test suite for useBodyCheckups React hook
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useBodyCheckups } from "../use-body-checkups";
import * as bodyCheckupDb from "../../lib/body-checkup-db";

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock database utilities
vi.mock("../../lib/body-checkup-db");

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return Wrapper;
};

describe("useBodyCheckups", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch body checkups for a member", async () => {
    const mockCheckups = [
      {
        id: "1",
        member_id: "member-1",
        checkup_date: "2025-10-18",
        weight: 75.5,
        notes: "Test",
        created_at: "2025-10-18T12:00:00Z",
        created_by: null,
      },
    ];

    vi.mocked(bodyCheckupDb.getBodyCheckups).mockResolvedValue(mockCheckups);
    vi.mocked(bodyCheckupDb.getLatestBodyCheckup).mockResolvedValue(
      mockCheckups[0]
    );
    vi.mocked(bodyCheckupDb.getBodyCheckupCount).mockResolvedValue(1);

    const { result } = renderHook(() => useBodyCheckups("member-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.checkups).toEqual(mockCheckups);
    expect(result.current.latestCheckup).toEqual(mockCheckups[0]);
    expect(result.current.checkupCount).toBe(1);
  });

  it("should create a new body checkup", async () => {
    const mockInput = {
      member_id: "member-1",
      checkup_date: "2025-10-18",
      weight: 75.5,
      notes: "New checkup",
    };
    const mockCheckup = {
      id: "1",
      ...mockInput,
      created_at: "2025-10-18T12:00:00Z",
      created_by: null,
    };

    vi.mocked(bodyCheckupDb.getBodyCheckups).mockResolvedValue([]);
    vi.mocked(bodyCheckupDb.getLatestBodyCheckup).mockResolvedValue(null);
    vi.mocked(bodyCheckupDb.getBodyCheckupCount).mockResolvedValue(0);
    vi.mocked(bodyCheckupDb.createBodyCheckup).mockResolvedValue(mockCheckup);

    const { result } = renderHook(() => useBodyCheckups("member-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await result.current.createCheckup(mockInput);

    await waitFor(() => expect(result.current.isCreating).toBe(false));

    expect(bodyCheckupDb.createBodyCheckup).toHaveBeenCalledWith(mockInput);
  });

  it("should update an existing body checkup", async () => {
    const mockUpdates = {
      weight: 76.0,
      notes: "Updated",
    };
    const mockCheckup = {
      id: "1",
      member_id: "member-1",
      checkup_date: "2025-10-18",
      ...mockUpdates,
      created_at: "2025-10-18T12:00:00Z",
      created_by: null,
    };

    vi.mocked(bodyCheckupDb.getBodyCheckups).mockResolvedValue([mockCheckup]);
    vi.mocked(bodyCheckupDb.getLatestBodyCheckup).mockResolvedValue(
      mockCheckup
    );
    vi.mocked(bodyCheckupDb.getBodyCheckupCount).mockResolvedValue(1);
    vi.mocked(bodyCheckupDb.updateBodyCheckup).mockResolvedValue(mockCheckup);

    const { result } = renderHook(() => useBodyCheckups("member-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await result.current.updateCheckup("1", mockUpdates);

    await waitFor(() => expect(result.current.isUpdating).toBe(false));

    expect(bodyCheckupDb.updateBodyCheckup).toHaveBeenCalledWith(
      "1",
      mockUpdates
    );
  });

  it("should delete a body checkup", async () => {
    const mockCheckups = [
      {
        id: "1",
        member_id: "member-1",
        checkup_date: "2025-10-18",
        weight: 75.5,
        notes: null,
        created_at: "2025-10-18T12:00:00Z",
        created_by: null,
      },
    ];

    vi.mocked(bodyCheckupDb.getBodyCheckups).mockResolvedValue(mockCheckups);
    vi.mocked(bodyCheckupDb.getLatestBodyCheckup).mockResolvedValue(
      mockCheckups[0]
    );
    vi.mocked(bodyCheckupDb.getBodyCheckupCount).mockResolvedValue(1);
    vi.mocked(bodyCheckupDb.deleteBodyCheckup).mockResolvedValue(undefined);

    const { result } = renderHook(() => useBodyCheckups("member-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await result.current.deleteCheckup("1");

    await waitFor(() => expect(result.current.isDeleting).toBe(false));

    expect(bodyCheckupDb.deleteBodyCheckup).toHaveBeenCalledWith("1");
  });
});
