/**
 * @fileoverview Integration tests for trial member creation during session booking
 * Tests the full workflow of creating a trial member and associating with a session
 */

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import React, { ReactNode } from "react";
import { useCreateTrainingSession } from "../../hooks/use-training-sessions";
import { supabase } from "@/lib/supabase";
import type { CreateSessionData } from "../../lib/types";

// Mock the Supabase client
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

// Mock date utilities
vi.mock("@/lib/date-utils", () => ({
  getLocalDateString: vi.fn(() => "2025-10-26"),
  formatForDatabase: vi.fn(() => "2025-10-26"),
  formatTimestampForDatabase: vi.fn(() => "2025-10-26T10:00:00.000Z"),
}));

// Mock subscription utils
vi.mock("@/features/memberships/lib/subscription-utils", () => ({
  subscriptionUtils: {
    getMemberActiveSubscription: vi.fn(() => Promise.resolve(null)),
    consumeSession: vi.fn(() => Promise.resolve()),
  },
}));

describe("Trial Member Creation Integration Tests", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  // Test 1: Creates trial member before session for trial session type
  it("creates trial member before session for trial session type", async () => {
    const mockNewMember = {
      id: "new-member-123",
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@test.com",
      member_type: "trial",
      status: "pending",
    };

    // Mock email uniqueness check (no existing member)
    const mockSelect = vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    }));

    // Mock member creation
    const mockInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() =>
          Promise.resolve({ data: mockNewMember, error: null })
        ),
      })),
    }));

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === "members") {
        return {
          select: mockSelect,
          insert: mockInsert,
        };
      }
      return {};
    });

    // Mock RPC call for session creation
    (supabase.rpc as any).mockResolvedValue({
      data: { success: true, session_id: "session-123" },
      error: null,
    });

    const trialSessionData: CreateSessionData = {
      machine_id: "machine-1",
      scheduled_start: "2025-10-26T10:00:00.000Z",
      scheduled_end: "2025-10-26T11:00:00.000Z",
      session_type: "trial",
      new_member_first_name: "John",
      new_member_last_name: "Doe",
      new_member_phone: "+1234567890",
      new_member_email: "john.doe@test.com",
      new_member_gender: "male",
      new_member_referral_source: "instagram",
    };

    const { result } = renderHook(() => useCreateTrainingSession(), {
      wrapper,
    });

    result.current.mutate(trialSessionData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify member was created
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@test.com",
        gender: "male",
        referral_source: "instagram",
        member_type: "trial",
        status: "pending",
      })
    );

    // Verify RPC was called with new member ID
    expect(supabase.rpc).toHaveBeenCalledWith(
      "create_training_session_with_members",
      expect.objectContaining({
        p_member_ids: ["new-member-123"],
        p_session_type: "trial",
      })
    );
  });

  // Test 2: Sets correct auto-fields for trial member
  it("auto-sets member_type='trial', status='pending', join_date=today", async () => {
    const mockInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() =>
          Promise.resolve({
            data: { id: "new-member-123" },
            error: null,
          })
        ),
      })),
    }));

    (supabase.from as any).mockImplementation(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() =>
            Promise.resolve({ data: null, error: null })
          ),
        })),
      })),
      insert: mockInsert,
    }));

    (supabase.rpc as any).mockResolvedValue({
      data: { success: true },
      error: null,
    });

    const { result } = renderHook(() => useCreateTrainingSession(), {
      wrapper,
    });

    result.current.mutate({
      machine_id: "machine-1",
      scheduled_start: "2025-10-26T10:00:00.000Z",
      scheduled_end: "2025-10-26T11:00:00.000Z",
      session_type: "trial",
      new_member_first_name: "Jane",
      new_member_last_name: "Smith",
      new_member_phone: "+1987654321",
      new_member_email: "jane@test.com",
      new_member_gender: "female",
      new_member_referral_source: "member_referral",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        member_type: "trial",
        status: "pending",
        join_date: "2025-10-26",
      })
    );
  });

  // Test 3: Rejects duplicate email with clear error message
  it("rejects duplicate email with user-friendly error message", async () => {
    // Mock existing member with same email
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === "members") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() =>
                Promise.resolve({
                  data: { id: "existing-member-123", member_type: "regular" },
                  error: null,
                })
              ),
            })),
          })),
        };
      } else if (table === "training_session_members") {
        // Mock that existing member HAS sessions (not orphaned)
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              limit: vi.fn(() =>
                Promise.resolve({
                  data: [{ id: "session-member-1" }], // Has sessions
                  error: null,
                })
              ),
            })),
          })),
        };
      }
      return {};
    });

    const { result } = renderHook(() => useCreateTrainingSession(), {
      wrapper,
    });

    result.current.mutate({
      machine_id: "machine-1",
      scheduled_start: "2025-10-26T10:00:00.000Z",
      scheduled_end: "2025-10-26T11:00:00.000Z",
      session_type: "trial",
      new_member_first_name: "Duplicate",
      new_member_last_name: "User",
      new_member_phone: "+1111111111",
      new_member_email: "existing@test.com",
      new_member_gender: "male",
      new_member_referral_source: "instagram",
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
    expect((result.current.error as Error).message).toBe(
      "This email is already registered. Please use a different email."
    );
  });

  // Test 4: Does not create member for non-trial session types
  it("does not create member for non-trial session types", async () => {
    const mockInsert = vi.fn();

    // Mock active subscription for member session validation
    const { subscriptionUtils } = await import(
      "@/features/memberships/lib/subscription-utils"
    );
    vi.mocked(subscriptionUtils.getMemberActiveSubscription).mockResolvedValue({
      id: "sub-123",
      member_id: "existing-member-123",
      plan_id: "plan-123",
      plan_name_snapshot: "Premium Plan",
      total_sessions_snapshot: 12,
      total_amount_snapshot: 1200,
      duration_days_snapshot: 365,
      start_date: "2025-01-01",
      end_date: "2026-01-01",
      status: "active",
      used_sessions: 5,
      paid_amount: 1200,
      created_at: "2025-01-01T00:00:00.000Z",
      updated_at: "2025-01-01T00:00:00.000Z",
    });

    (supabase.from as any).mockReturnValue({
      insert: mockInsert,
    });

    (supabase.rpc as any).mockResolvedValue({
      data: { success: true },
      error: null,
    });

    const { result } = renderHook(() => useCreateTrainingSession(), {
      wrapper,
    });

    result.current.mutate({
      machine_id: "machine-1",
      scheduled_start: "2025-10-26T10:00:00.000Z",
      scheduled_end: "2025-10-26T11:00:00.000Z",
      session_type: "member",
      member_id: "existing-member-123",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify no member creation happened
    expect(mockInsert).not.toHaveBeenCalled();

    // Verify RPC was called with existing member ID
    expect(supabase.rpc).toHaveBeenCalledWith(
      "create_training_session_with_members",
      expect.objectContaining({
        p_member_ids: ["existing-member-123"],
        p_session_type: "member",
      })
    );
  });

  // Test 5: Session creation automatically links to new member
  it("automatically creates training_session_members record", async () => {
    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() =>
            Promise.resolve({ data: null, error: null })
          ),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: { id: "new-member-123" },
              error: null,
            })
          ),
        })),
      })),
    });

    (supabase.rpc as any).mockResolvedValue({
      data: { success: true, session_id: "session-456" },
      error: null,
    });

    const { result } = renderHook(() => useCreateTrainingSession(), {
      wrapper,
    });

    result.current.mutate({
      machine_id: "machine-1",
      scheduled_start: "2025-10-26T10:00:00.000Z",
      scheduled_end: "2025-10-26T11:00:00.000Z",
      session_type: "trial",
      new_member_first_name: "Test",
      new_member_last_name: "User",
      new_member_phone: "+1234567890",
      new_member_email: "test@test.com",
      new_member_gender: "male",
      new_member_referral_source: "phone",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify RPC was called with new member ID
    expect(supabase.rpc).toHaveBeenCalledWith(
      "create_training_session_with_members",
      expect.objectContaining({
        p_member_ids: ["new-member-123"],
      })
    );
  });

  // Test 6: Handles member creation error gracefully
  it("throws error when member creation fails", async () => {
    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() =>
            Promise.resolve({ data: null, error: null })
          ),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: null,
              error: { message: "Database constraint violation" },
            })
          ),
        })),
      })),
    });

    const { result } = renderHook(() => useCreateTrainingSession(), {
      wrapper,
    });

    result.current.mutate({
      machine_id: "machine-1",
      scheduled_start: "2025-10-26T10:00:00.000Z",
      scheduled_end: "2025-10-26T11:00:00.000Z",
      session_type: "trial",
      new_member_first_name: "Error",
      new_member_last_name: "Case",
      new_member_phone: "+1000000000",
      new_member_email: "error@test.com",
      new_member_gender: "female",
      new_member_referral_source: "chatbot",
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
    expect((result.current.error as Error).message).toContain(
      "Failed to create trial member"
    );
  });

  // Test 7: Atomic operation - no partial member creation
  it("does not create session if member creation fails", async () => {
    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() =>
            Promise.resolve({ data: null, error: null })
          ),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: null,
              error: { message: "Member creation failed" },
            })
          ),
        })),
      })),
    });

    const { result } = renderHook(() => useCreateTrainingSession(), {
      wrapper,
    });

    result.current.mutate({
      machine_id: "machine-1",
      scheduled_start: "2025-10-26T10:00:00.000Z",
      scheduled_end: "2025-10-26T11:00:00.000Z",
      session_type: "trial",
      new_member_first_name: "Atomic",
      new_member_last_name: "Test",
      new_member_phone: "+1999999999",
      new_member_email: "atomic@test.com",
      new_member_gender: "male",
      new_member_referral_source: "website_ib",
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Verify RPC was never called (session not created)
    expect(supabase.rpc).not.toHaveBeenCalled();
  });
});
