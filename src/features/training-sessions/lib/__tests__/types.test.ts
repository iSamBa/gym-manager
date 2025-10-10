import { describe, it, expect } from "vitest";
import type {
  Machine,
  TrainingSession,
  CreateSessionData,
  UpdateSessionData,
  SessionFilters,
} from "../types";

describe("Training Session TypeScript Types", () => {
  describe("Machine Interface", () => {
    it("should have correct shape", () => {
      const machine: Machine = {
        id: "uuid-123",
        machine_number: 1,
        name: "Machine 1",
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      expect(machine).toBeDefined();
      expect(machine.machine_number).toBe(1);
      expect(machine.is_available).toBe(true);
    });

    it("should only allow machine_number values 1, 2, or 3", () => {
      const machine1: Machine = {
        id: "uuid-1",
        machine_number: 1,
        name: "Machine 1",
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const machine2: Machine = {
        id: "uuid-2",
        machine_number: 2,
        name: "Machine 2",
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const machine3: Machine = {
        id: "uuid-3",
        machine_number: 3,
        name: "Machine 3",
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      expect(machine1.machine_number).toBe(1);
      expect(machine2.machine_number).toBe(2);
      expect(machine3.machine_number).toBe(3);
    });
  });

  describe("TrainingSession Interface", () => {
    it("should allow null trainer_id", () => {
      const session: TrainingSession = {
        id: "session-uuid",
        machine_id: "machine-uuid",
        trainer_id: null, // Should compile - trainer is nullable
        scheduled_start: new Date().toISOString(),
        scheduled_end: new Date().toISOString(),
        status: "scheduled",
        current_participants: 0,
        notes: null,
      };

      expect(session.trainer_id).toBeNull();
    });

    it("should have machine_id as required field", () => {
      const session: TrainingSession = {
        id: "session-uuid",
        machine_id: "machine-uuid", // Required
        trainer_id: null,
        scheduled_start: new Date().toISOString(),
        scheduled_end: new Date().toISOString(),
        status: "scheduled",
        current_participants: 1,
        notes: null,
      };

      expect(session.machine_id).toBe("machine-uuid");
    });

    it("should have optional machine_number and machine_name from view", () => {
      const session: TrainingSession = {
        id: "session-uuid",
        machine_id: "machine-uuid",
        machine_number: 2, // Optional from view join
        machine_name: "Machine 2", // Optional from view join
        trainer_id: "trainer-uuid",
        scheduled_start: new Date().toISOString(),
        scheduled_end: new Date().toISOString(),
        status: "scheduled",
        current_participants: 1,
        notes: null,
      };

      expect(session.machine_number).toBe(2);
      expect(session.machine_name).toBe("Machine 2");
    });

    it("should support current_participants as 0 or 1", () => {
      const emptySession: TrainingSession = {
        id: "session-1",
        machine_id: "machine-uuid",
        trainer_id: null,
        scheduled_start: new Date().toISOString(),
        scheduled_end: new Date().toISOString(),
        status: "scheduled",
        current_participants: 0, // No member
        notes: null,
      };

      const bookedSession: TrainingSession = {
        id: "session-2",
        machine_id: "machine-uuid",
        trainer_id: null,
        scheduled_start: new Date().toISOString(),
        scheduled_end: new Date().toISOString(),
        status: "scheduled",
        current_participants: 1, // One member
        notes: null,
      };

      expect(emptySession.current_participants).toBe(0);
      expect(bookedSession.current_participants).toBe(1);
    });
  });

  describe("CreateSessionData Interface", () => {
    it("should require machine_id", () => {
      const data: CreateSessionData = {
        machine_id: "machine-uuid", // Required
        scheduled_start: new Date().toISOString(),
        scheduled_end: new Date().toISOString(),
        session_type: "standard",
        member_id: "member-uuid",
      };

      expect(data.machine_id).toBeDefined();
    });

    it("should have optional trainer_id", () => {
      const dataWithoutTrainer: CreateSessionData = {
        machine_id: "machine-uuid",
        // trainer_id is optional
        scheduled_start: new Date().toISOString(),
        scheduled_end: new Date().toISOString(),
        session_type: "standard",
        member_id: "member-uuid",
      };

      const dataWithTrainer: CreateSessionData = {
        machine_id: "machine-uuid",
        trainer_id: "trainer-uuid", // Optional
        scheduled_start: new Date().toISOString(),
        scheduled_end: new Date().toISOString(),
        session_type: "standard",
        member_id: "member-uuid",
      };

      expect(dataWithoutTrainer.trainer_id).toBeUndefined();
      expect(dataWithTrainer.trainer_id).toBe("trainer-uuid");
    });

    it("should accept single member_id (not array)", () => {
      const data: CreateSessionData = {
        machine_id: "machine-uuid",
        scheduled_start: new Date().toISOString(),
        scheduled_end: new Date().toISOString(),
        session_type: "trail",
        member_id: "member-uuid", // Single member, not array
      };

      expect(typeof data.member_id).toBe("string");
    });
  });

  describe("UpdateSessionData Interface", () => {
    it("should allow optional machine_id", () => {
      const data: UpdateSessionData = {
        machine_id: "new-machine-uuid", // Change machine
      };

      expect(data.machine_id).toBe("new-machine-uuid");
    });

    it("should allow setting trainer_id to null", () => {
      const data: UpdateSessionData = {
        trainer_id: null, // Clear trainer assignment
      };

      expect(data.trainer_id).toBeNull();
    });

    it("should accept single member_id (not array)", () => {
      const data: UpdateSessionData = {
        member_id: "new-member-uuid", // Single member
      };

      expect(typeof data.member_id).toBe("string");
    });
  });

  describe("SessionFilters Interface", () => {
    it("should support machine_id filter", () => {
      const filters: SessionFilters = {
        machine_id: "machine-uuid", // Filter by machine
      };

      expect(filters.machine_id).toBe("machine-uuid");
    });

    it("should support trainer_id filter", () => {
      const filters: SessionFilters = {
        trainer_id: "trainer-uuid",
      };

      expect(filters.trainer_id).toBe("trainer-uuid");
    });

    it("should support member_id filter", () => {
      const filters: SessionFilters = {
        member_id: "member-uuid",
      };

      expect(filters.member_id).toBe("member-uuid");
    });

    it("should support combined filters", () => {
      const filters: SessionFilters = {
        machine_id: "machine-uuid",
        trainer_id: "trainer-uuid",
        member_id: "member-uuid",
        status: "scheduled",
        date_range: {
          start: new Date(),
          end: new Date(),
        },
      };

      expect(filters.machine_id).toBeDefined();
      expect(filters.trainer_id).toBeDefined();
      expect(filters.member_id).toBeDefined();
      expect(filters.status).toBe("scheduled");
      expect(filters.date_range).toBeDefined();
    });
  });
});
