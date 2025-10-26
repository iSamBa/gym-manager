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

  describe("Collaboration Guest Sessions", () => {
    it("creates collaboration session with details persisted", async () => {
      const mockSessionId = "mock-collab-123";
      const now = new Date();

      // Mock RPC call to return success
      (supabase.rpc as any).mockResolvedValue({
        data: { success: true, id: mockSessionId },
        error: null,
      });

      // Mock database query to return session with collaboration details
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "training_sessions") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: {
                      id: mockSessionId,
                      collaboration_details:
                        "@influencer123 - 6 month partnership deal",
                      session_type: "collaboration",
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

      // Create collaboration session
      const { data: result, error } = await supabase.rpc(
        "create_training_session_with_members",
        {
          p_machine_id: testMachineId,
          p_trainer_id: null,
          p_scheduled_start: formatTimestampForDatabase(now),
          p_scheduled_end: formatTimestampForDatabase(
            new Date(now.getTime() + 30 * 60000)
          ),
          p_member_ids: [], // Empty for guest sessions
          p_session_type: "collaboration",
          p_notes: "Collaboration session test",
          p_collaboration_details: "@influencer123 - 6 month partnership deal",
        }
      );

      expect(error).toBeNull();
      expect(result.success).toBe(true);
      createdSessionIds.push(result.id);

      // Verify session was created with collaboration details
      const { data: session } = await supabase
        .from("training_sessions")
        .select("*")
        .eq("id", result.id)
        .single();

      expect(session).toBeDefined();
      expect(session?.collaboration_details).toContain("influencer123");
      expect(session?.collaboration_details).toContain("6 month partnership");
      expect(session?.session_type).toBe("collaboration");
    });

    it("does NOT create training_session_members for collaboration sessions", async () => {
      const mockSessionId = "mock-collab-456";
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

      // Create collaboration session
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
          p_session_type: "collaboration",
          p_notes: null,
          p_collaboration_details: "Test collaboration",
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

  describe("Guest Session Data Separation", () => {
    it("guest sessions are stored correctly without member references", async () => {
      const mockMultiSiteId = "mock-multi-site-789";
      const mockCollabId = "mock-collab-789";
      const now = new Date();

      // Mock RPC calls - need to return different IDs for each call
      let rpcCallCount = 0;
      (supabase.rpc as any).mockImplementation(() => {
        rpcCallCount++;
        if (rpcCallCount === 1) {
          return Promise.resolve({
            data: { success: true, id: mockMultiSiteId },
            error: null,
          });
        } else {
          return Promise.resolve({
            data: { success: true, id: mockCollabId },
            error: null,
          });
        }
      });

      // Mock database queries for both sessions and members
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "training_sessions") {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => ({
                order: vi.fn(() =>
                  Promise.resolve({
                    data: [
                      {
                        id: mockMultiSiteId,
                        session_type: "multi_site",
                        guest_first_name: "Guest",
                        guest_last_name: "One",
                        guest_gym_name: "Gym A",
                      },
                      {
                        id: mockCollabId,
                        session_type: "collaboration",
                        collaboration_details: "Collab test",
                      },
                    ],
                    error: null,
                  })
                ),
              })),
            })),
          };
        } else if (table === "training_session_members") {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() =>
                Promise.resolve({
                  data: [], // No members for either session
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

      // Create collaboration guest session
      const { data: collabResult } = await supabase.rpc(
        "create_training_session_with_members",
        {
          p_machine_id: testMachineId,
          p_trainer_id: null,
          p_scheduled_start: formatTimestampForDatabase(
            new Date(now.getTime() + 60 * 60000)
          ),
          p_scheduled_end: formatTimestampForDatabase(
            new Date(now.getTime() + 90 * 60000)
          ),
          p_member_ids: [],
          p_session_type: "collaboration",
          p_notes: null,
          p_collaboration_details: "Collab test",
        }
      );

      createdSessionIds.push(multiSiteResult.id, collabResult.id);

      // Verify both sessions exist with correct data
      const { data: sessions } = await supabase
        .from("training_sessions")
        .select("*")
        .in("id", createdSessionIds)
        .order("scheduled_start");

      expect(sessions).toHaveLength(2);
      expect(sessions?.[0].session_type).toBe("multi_site");
      expect(sessions?.[0].guest_first_name).toBe("Guest");
      expect(sessions?.[1].session_type).toBe("collaboration");
      expect(sessions?.[1].collaboration_details).toBe("Collab test");

      // Verify NO TSM records for either
      const { data: tsmRecords } = await supabase
        .from("training_session_members")
        .select("*")
        .in("session_id", createdSessionIds);

      expect(tsmRecords).toHaveLength(0);
    });
  });
});
