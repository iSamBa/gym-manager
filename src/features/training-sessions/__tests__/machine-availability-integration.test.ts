import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { supabase } from "@/lib/supabase";

/**
 * Integration tests for Machine Availability Controls (US-010)
 *
 * Tests AC-3 (Booking Prevention) and AC-4 (Existing Sessions Preserved)
 * Uses real Supabase database for end-to-end validation
 */

describe("Machine Availability - Integration Tests", { timeout: 30000 }, () => {
  let testMachineId: string;
  let testMemberId: string;
  let testSessionId: string;

  beforeAll(async () => {
    // Get a test machine
    const { data: machines } = await supabase
      .from("machines")
      .select("id")
      .limit(1)
      .single();

    testMachineId = machines?.id as string;

    // Get a test member
    const { data: members } = await supabase
      .from("members")
      .select("id")
      .limit(1)
      .single();

    testMemberId = members?.id as string;
  });

  afterAll(async () => {
    // Cleanup: Delete test session if created
    if (testSessionId) {
      await supabase.from("training_sessions").delete().eq("id", testSessionId);
    }

    // Cleanup: Ensure machine is re-enabled
    if (testMachineId) {
      await supabase
        .from("machines")
        .update({ is_available: true })
        .eq("id", testMachineId);
    }
  });

  describe("AC-3: Booking Prevention", () => {
    it("should prevent creating session on unavailable machine via API", async () => {
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

      // 4. Re-enable machine for other tests
      await supabase
        .from("machines")
        .update({ is_available: true })
        .eq("id", testMachineId);
    });

    it("should allow creating session on available machine", async () => {
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

      // Save for cleanup
      testSessionId = result.id;
    });
  });

  describe("AC-4: Existing Sessions Preserved", () => {
    it("should preserve existing sessions when disabling machine", async () => {
      // 1. Ensure machine is available and create a session
      await supabase
        .from("machines")
        .update({ is_available: true })
        .eq("id", testMachineId);

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

      // 4. Cleanup
      await supabase.from("training_sessions").delete().eq("id", sessionId);

      await supabase
        .from("machines")
        .update({ is_available: true })
        .eq("id", testMachineId);
    });

    it("should allow editing existing session on disabled machine", async () => {
      // 1. Create session on available machine
      await supabase
        .from("machines")
        .update({ is_available: true })
        .eq("id", testMachineId);

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

      // 5. Cleanup
      await supabase.from("training_sessions").delete().eq("id", sessionId);

      await supabase
        .from("machines")
        .update({ is_available: true })
        .eq("id", testMachineId);
    });

    it("should display existing sessions on disabled machine in calendar", async () => {
      // 1. Create session on available machine
      await supabase
        .from("machines")
        .update({ is_available: true })
        .eq("id", testMachineId);

      const scheduledStart = new Date(
        Date.now() + 120 * 60 * 60 * 1000
      ).toISOString();

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

      // 4. Cleanup
      await supabase.from("training_sessions").delete().eq("id", sessionId);

      await supabase
        .from("machines")
        .update({ is_available: true })
        .eq("id", testMachineId);
    });
  });

  describe("Machine Availability Toggle (Admin Operations)", () => {
    it("should successfully toggle machine availability", async () => {
      // 1. Get current state
      const { data: initialState } = await supabase
        .from("machines")
        .select("is_available")
        .eq("id", testMachineId)
        .single();

      const initialAvailability = initialState?.is_available;

      // 2. Toggle to opposite state
      const { error: updateError } = await supabase
        .from("machines")
        .update({ is_available: !initialAvailability })
        .eq("id", testMachineId);

      expect(updateError).toBeNull();

      // 3. Verify state changed
      const { data: newState } = await supabase
        .from("machines")
        .select("is_available")
        .eq("id", testMachineId)
        .single();

      expect(newState?.is_available).toBe(!initialAvailability);

      // 4. Toggle back to original state
      await supabase
        .from("machines")
        .update({ is_available: initialAvailability })
        .eq("id", testMachineId);
    });
  });
});
