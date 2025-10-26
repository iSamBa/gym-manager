import { describe, it, expect, afterEach } from "vitest";
import { supabase } from "@/lib/supabase";
import { formatTimestampForDatabase } from "@/lib/date-utils";

// Test data - using real machine ID from database (Machine 1)
const testMachineId = "36c9f544-4d63-47d4-8026-e72ba523a7ee";

describe("Guest Session Creation (AC-4: Data Persistence)", () => {
  let createdSessionIds: string[] = [];

  // Cleanup created sessions after each test
  afterEach(async () => {
    if (createdSessionIds.length > 0) {
      await supabase
        .from("training_sessions")
        .delete()
        .in("id", createdSessionIds);
      createdSessionIds = [];
    }
  });

  describe("Multi-Site Guest Sessions", () => {
    it("creates multi_site session with guest data persisted", async () => {
      const now = new Date();

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
    }, 10000);

    it("does NOT create training_session_members for multi_site sessions", async () => {
      const now = new Date();

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
    }, 10000);
  });

  describe("Collaboration Guest Sessions", () => {
    it("creates collaboration session with details persisted", async () => {
      const now = new Date();

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
    }, 10000);

    it("does NOT create training_session_members for collaboration sessions", async () => {
      const now = new Date();

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
    }, 10000);
  });

  describe("Guest Session Data Separation", () => {
    it("guest sessions are stored correctly without member references", async () => {
      const now = new Date();

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
    }, 10000);
  });
});
