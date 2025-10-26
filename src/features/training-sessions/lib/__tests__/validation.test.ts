import { describe, it, expect } from "vitest";
import { createSessionSchema, updateSessionSchema } from "../validation";

describe("Session Type Validation", () => {
  // Base required fields for all session types
  const baseSessionData = {
    machine_id: "123e4567-e89b-12d3-a456-426614174000",
    scheduled_start: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    scheduled_end: new Date(Date.now() + 90000000).toISOString(), // Tomorrow + 1 hour
  };

  describe("AC-1: Trial Session Validation", () => {
    it("validates trial session with all required fields", () => {
      const validTrialSession = {
        ...baseSessionData,
        session_type: "trial" as const,
        new_member_first_name: "John",
        new_member_last_name: "Doe",
        new_member_phone: "1234567890",
        new_member_email: "john.doe@example.com",
        new_member_gender: "male" as const,
        new_member_referral_source: "instagram" as const,
      };

      const result = createSessionSchema.safeParse(validTrialSession);
      expect(result.success).toBe(true);
    });

    it("rejects trial session missing new_member_first_name", () => {
      const invalidTrialSession = {
        ...baseSessionData,
        session_type: "trial" as const,
        // missing new_member_first_name
        new_member_last_name: "Doe",
        new_member_phone: "1234567890",
        new_member_email: "john.doe@example.com",
        new_member_gender: "male" as const,
        new_member_referral_source: "instagram" as const,
      };

      const result = createSessionSchema.safeParse(invalidTrialSession);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("session_type");
      }
    });

    it("rejects trial session missing new_member_last_name", () => {
      const invalidTrialSession = {
        ...baseSessionData,
        session_type: "trial" as const,
        new_member_first_name: "John",
        // missing new_member_last_name
        new_member_phone: "1234567890",
        new_member_email: "john.doe@example.com",
        new_member_gender: "male" as const,
        new_member_referral_source: "instagram" as const,
      };

      const result = createSessionSchema.safeParse(invalidTrialSession);
      expect(result.success).toBe(false);
    });

    it("rejects trial session with invalid email format", () => {
      const invalidTrialSession = {
        ...baseSessionData,
        session_type: "trial" as const,
        new_member_first_name: "John",
        new_member_last_name: "Doe",
        new_member_phone: "1234567890",
        new_member_email: "invalid-email", // Invalid format
        new_member_gender: "male" as const,
        new_member_referral_source: "instagram" as const,
      };

      const result = createSessionSchema.safeParse(invalidTrialSession);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("new_member_email");
      }
    });

    it("rejects trial session with empty string fields", () => {
      const invalidTrialSession = {
        ...baseSessionData,
        session_type: "trial" as const,
        new_member_first_name: "", // Empty string
        new_member_last_name: "Doe",
        new_member_phone: "1234567890",
        new_member_email: "john.doe@example.com",
        new_member_gender: "male" as const,
        new_member_referral_source: "instagram" as const,
      };

      const result = createSessionSchema.safeParse(invalidTrialSession);
      expect(result.success).toBe(false);
    });
  });

  describe("AC-2: Member/Contractual/Makeup Validation", () => {
    it("validates member session with member_id", () => {
      const validMemberSession = {
        ...baseSessionData,
        session_type: "member" as const,
        member_id: "123e4567-e89b-12d3-a456-426614174001",
      };

      const result = createSessionSchema.safeParse(validMemberSession);
      expect(result.success).toBe(true);
    });

    it("rejects member session without member_id", () => {
      const invalidMemberSession = {
        ...baseSessionData,
        session_type: "member" as const,
        // missing member_id
      };

      const result = createSessionSchema.safeParse(invalidMemberSession);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("session_type");
      }
    });

    it("validates contractual session with member_id", () => {
      const validContractualSession = {
        ...baseSessionData,
        session_type: "contractual" as const,
        member_id: "123e4567-e89b-12d3-a456-426614174002",
      };

      const result = createSessionSchema.safeParse(validContractualSession);
      expect(result.success).toBe(true);
    });

    it("rejects contractual session without member_id", () => {
      const invalidContractualSession = {
        ...baseSessionData,
        session_type: "contractual" as const,
        // missing member_id
      };

      const result = createSessionSchema.safeParse(invalidContractualSession);
      expect(result.success).toBe(false);
    });

    it("validates makeup session with member_id", () => {
      const validMakeupSession = {
        ...baseSessionData,
        session_type: "makeup" as const,
        member_id: "123e4567-e89b-12d3-a456-426614174003",
      };

      const result = createSessionSchema.safeParse(validMakeupSession);
      expect(result.success).toBe(true);
    });

    it("rejects makeup session without member_id", () => {
      const invalidMakeupSession = {
        ...baseSessionData,
        session_type: "makeup" as const,
        // missing member_id
      };

      const result = createSessionSchema.safeParse(invalidMakeupSession);
      expect(result.success).toBe(false);
    });

    it("rejects member session with invalid UUID format", () => {
      const invalidMemberSession = {
        ...baseSessionData,
        session_type: "member" as const,
        member_id: "invalid-uuid", // Invalid UUID
      };

      const result = createSessionSchema.safeParse(invalidMemberSession);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("member_id");
      }
    });

    it("validates member session with optional trainer_id and notes", () => {
      const validMemberSession = {
        ...baseSessionData,
        session_type: "member" as const,
        member_id: "123e4567-e89b-12d3-a456-426614174001",
        trainer_id: "123e4567-e89b-12d3-a456-426614174010",
        notes: "Special instructions for this session",
      };

      const result = createSessionSchema.safeParse(validMemberSession);
      expect(result.success).toBe(true);
    });
  });

  describe("AC-3: Multi-Site Validation", () => {
    it("validates multi_site session with guest data", () => {
      const validMultiSiteSession = {
        ...baseSessionData,
        session_type: "multi_site" as const,
        guest_first_name: "Jane",
        guest_last_name: "Smith",
        guest_gym_name: "Partner Gym Downtown",
      };

      const result = createSessionSchema.safeParse(validMultiSiteSession);
      expect(result.success).toBe(true);
    });

    it("rejects multi_site session missing guest_first_name", () => {
      const invalidMultiSiteSession = {
        ...baseSessionData,
        session_type: "multi_site" as const,
        // missing guest_first_name
        guest_last_name: "Smith",
        guest_gym_name: "Partner Gym",
      };

      const result = createSessionSchema.safeParse(invalidMultiSiteSession);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("session_type");
      }
    });

    it("rejects multi_site session missing guest_last_name", () => {
      const invalidMultiSiteSession = {
        ...baseSessionData,
        session_type: "multi_site" as const,
        guest_first_name: "Jane",
        // missing guest_last_name
        guest_gym_name: "Partner Gym",
      };

      const result = createSessionSchema.safeParse(invalidMultiSiteSession);
      expect(result.success).toBe(false);
    });

    it("rejects multi_site session missing guest_gym_name", () => {
      const invalidMultiSiteSession = {
        ...baseSessionData,
        session_type: "multi_site" as const,
        guest_first_name: "Jane",
        guest_last_name: "Smith",
        // missing guest_gym_name
      };

      const result = createSessionSchema.safeParse(invalidMultiSiteSession);
      expect(result.success).toBe(false);
    });

    it("rejects multi_site session with empty guest strings", () => {
      const invalidMultiSiteSession = {
        ...baseSessionData,
        session_type: "multi_site" as const,
        guest_first_name: "", // Empty string
        guest_last_name: "Smith",
        guest_gym_name: "Partner Gym",
      };

      const result = createSessionSchema.safeParse(invalidMultiSiteSession);
      expect(result.success).toBe(false);
    });

    it("validates multi_site session without member_id", () => {
      const validMultiSiteSession = {
        ...baseSessionData,
        session_type: "multi_site" as const,
        guest_first_name: "Jane",
        guest_last_name: "Smith",
        guest_gym_name: "Partner Gym",
        // NO member_id - this should be valid
      };

      const result = createSessionSchema.safeParse(validMultiSiteSession);
      expect(result.success).toBe(true);
    });
  });

  describe("AC-4: Collaboration Validation", () => {
    it("validates collaboration session with details", () => {
      const validCollaborationSession = {
        ...baseSessionData,
        session_type: "collaboration" as const,
        collaboration_details:
          "Influencer partnership - @fitnessguru content shoot",
      };

      const result = createSessionSchema.safeParse(validCollaborationSession);
      expect(result.success).toBe(true);
    });

    it("rejects collaboration session missing collaboration_details", () => {
      const invalidCollaborationSession = {
        ...baseSessionData,
        session_type: "collaboration" as const,
        // missing collaboration_details
      };

      const result = createSessionSchema.safeParse(invalidCollaborationSession);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("session_type");
      }
    });

    it("rejects collaboration session with empty collaboration_details", () => {
      const invalidCollaborationSession = {
        ...baseSessionData,
        session_type: "collaboration" as const,
        collaboration_details: "", // Empty string
      };

      const result = createSessionSchema.safeParse(invalidCollaborationSession);
      expect(result.success).toBe(false);
    });

    it("validates collaboration session without member_id", () => {
      const validCollaborationSession = {
        ...baseSessionData,
        session_type: "collaboration" as const,
        collaboration_details: "Commercial partnership",
        // NO member_id - this should be valid
      };

      const result = createSessionSchema.safeParse(validCollaborationSession);
      expect(result.success).toBe(true);
    });
  });

  describe("AC-5: Non-Bookable Validation", () => {
    it("validates non_bookable session without member_id", () => {
      const validNonBookableSession = {
        ...baseSessionData,
        session_type: "non_bookable" as const,
        // NO member_id needed
      };

      const result = createSessionSchema.safeParse(validNonBookableSession);
      expect(result.success).toBe(true);
    });

    it("validates non_bookable session with optional notes", () => {
      const validNonBookableSession = {
        ...baseSessionData,
        session_type: "non_bookable" as const,
        notes: "Machine maintenance scheduled",
      };

      const result = createSessionSchema.safeParse(validNonBookableSession);
      expect(result.success).toBe(true);
    });

    it("validates non_bookable session with no additional fields", () => {
      const validNonBookableSession = {
        ...baseSessionData,
        session_type: "non_bookable" as const,
      };

      const result = createSessionSchema.safeParse(validNonBookableSession);
      expect(result.success).toBe(true);
    });
  });

  describe("Update Schema Validation", () => {
    it("validates member session update with member_id", () => {
      const validUpdate = {
        session_type: "member" as const,
        member_id: "123e4567-e89b-12d3-a456-426614174001",
      };

      const result = updateSessionSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("validates trial session update with all required fields", () => {
      const validUpdate = {
        session_type: "trial" as const,
        new_member_first_name: "John",
        new_member_last_name: "Doe",
        new_member_phone: "1234567890",
        new_member_email: "john@example.com",
        new_member_gender: "male" as const,
        new_member_referral_source: "instagram" as const,
      };

      const result = updateSessionSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("allows partial updates without session_type", () => {
      const validUpdate = {
        notes: "Updated notes",
        trainer_id: "123e4567-e89b-12d3-a456-426614174010",
      };

      const result = updateSessionSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("rejects update with session_type change but missing required fields", () => {
      const invalidUpdate = {
        session_type: "trial" as const,
        // missing trial fields
      };

      const result = updateSessionSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  describe("Edge Cases and Additional Validations", () => {
    it("validates all referral source options for trial sessions", () => {
      const sources = [
        "instagram",
        "member_referral",
        "website_ib",
        "prospection",
        "studio",
        "phone",
        "chatbot",
      ] as const;

      sources.forEach((source) => {
        const validTrialSession = {
          ...baseSessionData,
          session_type: "trial" as const,
          new_member_first_name: "John",
          new_member_last_name: "Doe",
          new_member_phone: "1234567890",
          new_member_email: "john@example.com",
          new_member_gender: "male" as const,
          new_member_referral_source: source,
        };

        const result = createSessionSchema.safeParse(validTrialSession);
        expect(result.success).toBe(true);
      });
    });

    it("validates both gender options for trial sessions", () => {
      const genders = ["male", "female"] as const;

      genders.forEach((gender) => {
        const validTrialSession = {
          ...baseSessionData,
          session_type: "trial" as const,
          new_member_first_name: "John",
          new_member_last_name: "Doe",
          new_member_phone: "1234567890",
          new_member_email: "john@example.com",
          new_member_gender: gender,
          new_member_referral_source: "instagram" as const,
        };

        const result = createSessionSchema.safeParse(validTrialSession);
        expect(result.success).toBe(true);
      });
    });

    it("validates complex email formats for trial sessions", () => {
      const emails = [
        "simple@example.com",
        "user+tag@example.co.uk",
        "first.last@subdomain.example.com",
        "user123@example-domain.com",
      ];

      emails.forEach((email) => {
        const validTrialSession = {
          ...baseSessionData,
          session_type: "trial" as const,
          new_member_first_name: "John",
          new_member_last_name: "Doe",
          new_member_phone: "1234567890",
          new_member_email: email,
          new_member_gender: "male" as const,
          new_member_referral_source: "instagram" as const,
        };

        const result = createSessionSchema.safeParse(validTrialSession);
        expect(result.success).toBe(true);
      });
    });

    it("rejects invalid email formats", () => {
      const invalidEmails = [
        "notanemail",
        "@example.com",
        "user@",
        "user @example.com",
        "user@example",
      ];

      invalidEmails.forEach((email) => {
        const invalidTrialSession = {
          ...baseSessionData,
          session_type: "trial" as const,
          new_member_first_name: "John",
          new_member_last_name: "Doe",
          new_member_phone: "1234567890",
          new_member_email: email,
          new_member_gender: "male" as const,
          new_member_referral_source: "instagram" as const,
        };

        const result = createSessionSchema.safeParse(invalidTrialSession);
        expect(result.success).toBe(false);
      });
    });
  });
});
