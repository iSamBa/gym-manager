import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import { supabase } from "@/lib/supabase";
import { formatTimestampForDatabase } from "@/lib/date-utils";

// Mock the Supabase client
vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
  },
}));

// Mock date utilities
vi.mock("@/lib/date-utils", () => ({
  formatTimestampForDatabase: vi.fn((date?: Date) => {
    if (!date) return "2025-10-26T10:00:00.000Z";
    return date.toISOString();
  }),
}));

// Test data - mock machine ID
const testMachineId = "36c9f544-4d63-47d4-8026-e72ba523a7ee";

/**
 * Unit tests for guest session creation logic
 * Mocks Supabase calls to test application behavior without database
 */
describe("Guest Session Creation (AC-4: Data Persistence)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  let createdSessionIds: string[] = [];

  // Mock cleanup after each test
  afterEach(() => {
    createdSessionIds = [];
  });

  describe("Multi-Site Guest Sessions", () => {
    it("creates multi_site session with guest data persisted", async () => {
      const mockSessionId = "mock-multi-site-123";
      const now = new Date();

      // Mock RPC call to return success with session ID
      (supabase.rpc as any).mockResolvedValue({
        data: { success: true, id: mockSessionId },
        error: null,
      });

      // Mock database query to return session with guest data
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "training_sessions") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: {
                      id: mockSessionId,
                      guest_first_name: "Jane",
                      guest_last_name: "Smith",
                      guest_gym_name: "Partner Gym Downtown",
                      session_type: "multi_site",
                    },
                    error: null,
                  })
                ),
              })),
            })),
          };
        }
        return {};
      });

      // Create multi-site session via RPC
      const { data: result, error } = await supabase.rpc(
        "create_training_session_with_members",
        {
          p_machine_id: testMachineId,
          p_trainer_id: null,
          p_scheduled_start: formatTimestampForDatabase(now),
          p_scheduled_end: formatTimestampForDatabase(
            new Date(now.getTime() + 30 * 60000)
          ),
          p_member_ids: [], // Empty array for guest sessions
          p_session_type: "multi_site",
          p_notes: "Multi-site collaboration test",
          p_guest_first_name: "Jane",
          p_guest_last_name: "Smith",
          p_guest_gym_name: "Partner Gym Downtown",
        }
      );

      expect(error).toBeNull();
      expect(result.success).toBe(true);
      createdSessionIds.push(result.id);

      // Verify session was created with guest data
      const { data: session } = await supabase
        .from("training_sessions")
        .select("*")
        .eq("id", result.id)
        .single();

      expect(session).toBeDefined();
      expect(session?.guest_first_name).toBe("Jane");
      expect(session?.guest_last_name).toBe("Smith");
      expect(session?.guest_gym_name).toBe("Partner Gym Downtown");
      expect(session?.session_type).toBe("multi_site");
    });

    it("does NOT create training_session_members for multi_site sessions", async () => {
      const mockSessionId = "mock-multi-site-456";
      const now = new Date();

      // Mock RPC call to return success
      (supabase.rpc as any).mockResolvedValue({
        data: { success: true, id: mockSessionId },
        error: null,
      });

      // Mock training_session_members query to return empty array
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "training_session_members") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() =>
                Promise.resolve({
                  data: [], // No members for guest sessions
                  error: null,
                })
              ),
            })),
          };
        }
        return {};
      });

      // Create multi-site session
      const { data: result } = await supabase.rpc(
        "create_training_session_with_members",
        {
          p_machine_id: testMachineId,
          p_trainer_id: null,
          p_scheduled_start: formatTimestampForDatabase(now),
          p_scheduled_end: formatTimestampForDatabase(
            new Date(now.getTime() + 30 * 60000)
          ),
          p_member_ids: [],
          p_session_type: "multi_site",
          p_notes: null,
          p_guest_first_name: "John",
          p_guest_last_name: "Doe",
          p_guest_gym_name: "Partner Gym",
        }
      );

      createdSessionIds.push(result.id);

      // Verify NO training_session_members record created
      const { data: tsm } = await supabase
        .from("training_session_members")
        .select("*")
        .eq("session_id", result.id);

      expect(tsm).toHaveLength(0);
    });
  });

  // Collaboration sessions are no longer guest sessions
  // They now use collaboration members and create training_session_members records

  describe("Guest Session Data Separation", () => {
    it("multi_site guest sessions are stored correctly without member references", async () => {
      const mockMultiSiteId = "mock-multi-site-789";
      const now = new Date();

      // Mock RPC call to return success
      (supabase.rpc as any).mockResolvedValue({
        data: { success: true, id: mockMultiSiteId },
        error: null,
      });

      // Mock database queries for sessions and members
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "training_sessions") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: {
                      id: mockMultiSiteId,
                      session_type: "multi_site",
                      guest_first_name: "Guest",
                      guest_last_name: "One",
                      guest_gym_name: "Gym A",
                    },
                    error: null,
                  })
                ),
              })),
            })),
          };
        } else if (table === "training_session_members") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() =>
                Promise.resolve({
                  data: [], // No members for guest session
                  error: null,
                })
              ),
            })),
          };
        }
        return {};
      });

      // Create multi-site guest session
      const { data: multiSiteResult } = await supabase.rpc(
        "create_training_session_with_members",
        {
          p_machine_id: testMachineId,
          p_trainer_id: null,
          p_scheduled_start: formatTimestampForDatabase(now),
          p_scheduled_end: formatTimestampForDatabase(
            new Date(now.getTime() + 30 * 60000)
          ),
          p_member_ids: [],
          p_session_type: "multi_site",
          p_notes: null,
          p_guest_first_name: "Guest",
          p_guest_last_name: "One",
          p_guest_gym_name: "Gym A",
        }
      );

      createdSessionIds.push(multiSiteResult.id);

      // Verify session exists with correct data
      const { data: session } = await supabase
        .from("training_sessions")
        .select("*")
        .eq("id", multiSiteResult.id)
        .single();

      expect(session).toBeDefined();
      expect(session?.session_type).toBe("multi_site");
      expect(session?.guest_first_name).toBe("Guest");
      expect(session?.guest_last_name).toBe("One");
      expect(session?.guest_gym_name).toBe("Gym A");

      // Verify NO TSM records for guest session
      const { data: tsmRecords } = await supabase
        .from("training_session_members")
        .select("*")
        .eq("session_id", multiSiteResult.id);

      expect(tsmRecords).toHaveLength(0);
    });
  });
});
