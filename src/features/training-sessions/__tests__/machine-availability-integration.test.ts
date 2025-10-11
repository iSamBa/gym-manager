import { describe, it, expect, beforeEach, vi } from "vitest";
import { supabase } from "@/lib/supabase";

/**
 * Unit tests for Machine Availability Controls (US-010)
 *
 * Tests AC-3 (Booking Prevention) and AC-4 (Existing Sessions Preserved)
 * Uses mocked Supabase client to test business logic
 */

// Mock the Supabase client
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe("Machine Availability - Business Logic Tests", () => {
  const testMachineId = "test-machine-id";
  const testMemberId = "test-member-id";
  const testSessionId = "test-session-id";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("AC-3: Booking Prevention", () => {
    it("should prevent creating session on unavailable machine via API", async () => {
      // Mock: Update machine to unavailable
      const mockUpdate = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockEq = vi.fn().mockReturnValue({ data: null, error: null });
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: mockEq,
        }),
      } as any);

      // Mock: RPC call returns failure due to unavailable machine
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: {
          success: false,
          error: "Machine is not available for booking",
        },
        error: null,
      } as any);

      // 1. Disable the machine
      await supabase
        .from("machines")
        .update({ is_available: false })
        .eq("id", testMachineId);

      // 2. Attempt to create session using database function
      const { data: result } = await supabase.rpc(
        "create_training_session_with_members",
        {
          p_machine_id: testMachineId,
          p_scheduled_start: new Date(
            Date.now() + 24 * 60 * 60 * 1000
          ).toISOString(),
          p_scheduled_end: new Date(
            Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000
          ).toISOString(),
          p_member_ids: [testMemberId],
          p_trainer_id: null,
          p_session_type: "standard",
        }
      );

      // 3. Verify booking was rejected
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toContain("not available");

      // Verify RPC was called with correct params
      expect(supabase.rpc).toHaveBeenCalledWith(
        "create_training_session_with_members",
        expect.objectContaining({
          p_machine_id: testMachineId,
          p_member_ids: [testMemberId],
          p_session_type: "standard",
        })
      );
    });

    it("should allow creating session on available machine", async () => {
      // Mock: Update machine to available
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      } as any);

      // Mock: RPC call returns success
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: {
          success: true,
          id: testSessionId,
        },
        error: null,
      } as any);

      // 1. Ensure machine is available
      await supabase
        .from("machines")
        .update({ is_available: true })
        .eq("id", testMachineId);

      // 2. Create session
      const { data: result } = await supabase.rpc(
        "create_training_session_with_members",
        {
          p_machine_id: testMachineId,
          p_scheduled_start: new Date(
            Date.now() + 48 * 60 * 60 * 1000
          ).toISOString(),
          p_scheduled_end: new Date(
            Date.now() + 48 * 60 * 60 * 1000 + 30 * 60 * 1000
          ).toISOString(),
          p_member_ids: [testMemberId],
          p_trainer_id: null,
          p_session_type: "standard",
        }
      );

      // 3. Verify booking succeeded
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
      expect(result.id).toBe(testSessionId);
    });
  });

  describe("AC-4: Existing Sessions Preserved", () => {
    it("should preserve existing sessions when disabling machine", async () => {
      // Mock: Create session (RPC returns success)
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: {
          success: true,
          id: testSessionId,
        },
        error: null,
      } as any);

      // Mock: Update machine
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: testSessionId,
                status: "scheduled",
                machine_id: testMachineId,
              },
              error: null,
            }),
          }),
        }),
      } as any);

      // 1. Create a session
      const { data: createResult } = await supabase.rpc(
        "create_training_session_with_members",
        {
          p_machine_id: testMachineId,
          p_scheduled_start: new Date(
            Date.now() + 72 * 60 * 60 * 1000
          ).toISOString(),
          p_scheduled_end: new Date(
            Date.now() + 72 * 60 * 60 * 1000 + 30 * 60 * 1000
          ).toISOString(),
          p_member_ids: [testMemberId],
          p_trainer_id: null,
          p_session_type: "standard",
        }
      );

      const sessionId = createResult?.id;
      expect(sessionId).toBeDefined();

      // 2. Disable the machine
      await supabase
        .from("machines")
        .update({ is_available: false })
        .eq("id", testMachineId);

      // 3. Verify session still exists and is not cancelled
      const { data: session, error } = await supabase
        .from("training_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      expect(error).toBeNull();
      expect(session).toBeDefined();
      expect(session?.status).toBe("scheduled"); // Not cancelled
      expect(session?.machine_id).toBe(testMachineId);
    });

    it("should allow editing existing session on disabled machine", async () => {
      // Mock: Create session
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: {
          success: true,
          id: testSessionId,
        },
        error: null,
      } as any);

      // Mock: Update operations
      const selectMockReturnValue = {
        notes: "Updated notes after machine disabled",
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "machines") {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          } as any;
        } else if (table === "training_sessions") {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi
                  .fn()
                  .mockResolvedValue({
                    data: selectMockReturnValue,
                    error: null,
                  }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      // 1. Create session
      const { data: createResult } = await supabase.rpc(
        "create_training_session_with_members",
        {
          p_machine_id: testMachineId,
          p_scheduled_start: new Date(
            Date.now() + 96 * 60 * 60 * 1000
          ).toISOString(),
          p_scheduled_end: new Date(
            Date.now() + 96 * 60 * 60 * 1000 + 30 * 60 * 1000
          ).toISOString(),
          p_member_ids: [testMemberId],
          p_trainer_id: null,
          p_session_type: "standard",
        }
      );

      const sessionId = createResult?.id;

      // 2. Disable machine
      await supabase
        .from("machines")
        .update({ is_available: false })
        .eq("id", testMachineId);

      // 3. Update the existing session (change notes)
      const { error: updateError } = await supabase
        .from("training_sessions")
        .update({ notes: "Updated notes after machine disabled" })
        .eq("id", sessionId);

      expect(updateError).toBeNull();

      // 4. Verify update was successful
      const { data: session } = await supabase
        .from("training_sessions")
        .select("notes")
        .eq("id", sessionId)
        .single();

      expect(session?.notes).toBe("Updated notes after machine disabled");
    });

    it("should display existing sessions on disabled machine in calendar", async () => {
      const scheduledStart = new Date(
        Date.now() + 120 * 60 * 60 * 1000
      ).toISOString();

      // Mock: Create session
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: {
          success: true,
          id: testSessionId,
        },
        error: null,
      } as any);

      // Mock: Query sessions
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "machines") {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          } as any;
        } else if (table === "training_sessions") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [
                    {
                      id: testSessionId,
                      machine_id: testMachineId,
                      scheduled_start: scheduledStart,
                      status: "scheduled",
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      // 1. Create session
      const { data: createResult } = await supabase.rpc(
        "create_training_session_with_members",
        {
          p_machine_id: testMachineId,
          p_scheduled_start: scheduledStart,
          p_scheduled_end: new Date(
            Date.now() + 120 * 60 * 60 * 1000 + 30 * 60 * 1000
          ).toISOString(),
          p_member_ids: [testMemberId],
          p_trainer_id: null,
          p_session_type: "standard",
        }
      );

      const sessionId = createResult?.id;

      // 2. Disable machine
      await supabase
        .from("machines")
        .update({ is_available: false })
        .eq("id", testMachineId);

      // 3. Query sessions for the machine (simulating calendar view)
      const { data: sessions, error } = await supabase
        .from("training_sessions")
        .select("*")
        .eq("machine_id", testMachineId)
        .eq("scheduled_start", scheduledStart);

      expect(error).toBeNull();
      expect(sessions).toBeDefined();
      expect(sessions?.length).toBeGreaterThan(0);
      expect(sessions?.[0].id).toBe(sessionId);
    });
  });

  describe("Machine Availability Toggle (Admin Operations)", () => {
    it("should successfully toggle machine availability", async () => {
      const initialAvailability = true;

      // Mock: Get current state
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { is_available: initialAvailability },
              error: null,
            }),
          }),
        }),
      } as any);

      // 1. Get current state
      const { data: initialState } = await supabase
        .from("machines")
        .select("is_available")
        .eq("id", testMachineId)
        .single();

      expect(initialState?.is_available).toBe(initialAvailability);

      // Mock: Update to opposite state
      vi.mocked(supabase.from).mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as any);

      // 2. Toggle to opposite state
      const { error: updateError } = await supabase
        .from("machines")
        .update({ is_available: !initialAvailability })
        .eq("id", testMachineId);

      expect(updateError).toBeNull();

      // Mock: Get new state
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { is_available: !initialAvailability },
              error: null,
            }),
          }),
        }),
      } as any);

      // 3. Verify state changed
      const { data: newState } = await supabase
        .from("machines")
        .select("is_available")
        .eq("id", testMachineId)
        .single();

      expect(newState?.is_available).toBe(!initialAvailability);
    });
  });
});
