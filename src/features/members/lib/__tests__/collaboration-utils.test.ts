import { describe, it, expect, beforeEach, vi } from "vitest";
import { convertCollaborationMember } from "../collaboration-utils";
import type { Member } from "@/features/database/lib/types";
import { formatForDatabase } from "@/lib/date-utils";

// Mock Supabase
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock date-utils
vi.mock("@/lib/date-utils", () => ({
  formatForDatabase: vi.fn(() => "2025-11-02"),
}));

describe("convertCollaborationMember", () => {
  const mockCollaborationMember: Member = {
    id: "member-1",
    first_name: "John",
    last_name: "Doe",
    email: "john@example.com",
    phone: "1234567890",
    status: "active",
    member_type: "collaboration",
    join_date: "2025-01-01",
    partnership_company: "Tech Corp",
    partnership_type: "corporate",
    partnership_contract_start: "2025-01-01",
    partnership_contract_end: null,
    partnership_notes: "Corporate partnership",
    notes: "Initial notes",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  };

  const mockFullMember: Member = {
    id: "member-2",
    first_name: "Jane",
    last_name: "Smith",
    email: "jane@example.com",
    phone: "0987654321",
    status: "active",
    member_type: "full",
    join_date: "2025-01-01",
    partnership_company: null,
    partnership_type: null,
    partnership_contract_start: null,
    partnership_contract_end: null,
    partnership_notes: null,
    notes: null,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should convert collaboration member to full", async () => {
    const { supabase } = await import("@/lib/supabase");
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi
      .fn()
      .mockResolvedValue({ data: mockCollaborationMember, error: null });

    const mockUpdate = vi.fn().mockReturnThis();
    const mockUpdateEq = vi.fn().mockReturnThis();
    const mockUpdateSelect = vi.fn().mockReturnThis();
    const mockUpdateSingle = vi.fn().mockResolvedValue({
      data: {
        ...mockCollaborationMember,
        member_type: "full",
        status: "active",
      },
      error: null,
    });

    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === "members") {
        return {
          select: mockSelect,
          update: mockUpdate,
        };
      }
      return {};
    }) as any);

    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValue({
      single: mockSingle,
    });

    mockUpdate.mockReturnValue({
      eq: mockUpdateEq,
    });
    mockUpdateEq.mockReturnValue({
      select: mockUpdateSelect,
    });
    mockUpdateSelect.mockReturnValue({
      single: mockUpdateSingle,
    });

    const result = await convertCollaborationMember({
      member_id: "member-1",
    });

    expect(result.success).toBe(true);
    expect(result.member?.member_type).toBe("full");
    expect(result.member?.status).toBe("active");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        member_type: "full",
        status: "active",
      })
    );
  });

  it("should preserve partnership data", async () => {
    const { supabase } = await import("@/lib/supabase");
    const updatedMember = {
      ...mockCollaborationMember,
      member_type: "full" as const,
      status: "active" as const,
      // Partnership data preserved
      partnership_company: "Tech Corp",
      partnership_type: "corporate",
      partnership_contract_start: "2025-01-01",
    };

    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi
      .fn()
      .mockResolvedValue({ data: mockCollaborationMember, error: null });

    const mockUpdate = vi.fn().mockReturnThis();
    const mockUpdateEq = vi.fn().mockReturnThis();
    const mockUpdateSelect = vi.fn().mockReturnThis();
    const mockUpdateSingle = vi.fn().mockResolvedValue({
      data: updatedMember,
      error: null,
    });

    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === "members") {
        return {
          select: mockSelect,
          update: mockUpdate,
        };
      }
      return {};
    }) as any);

    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValue({
      single: mockSingle,
    });

    mockUpdate.mockReturnValue({
      eq: mockUpdateEq,
    });
    mockUpdateEq.mockReturnValue({
      select: mockUpdateSelect,
    });
    mockUpdateSelect.mockReturnValue({
      single: mockUpdateSingle,
    });

    const result = await convertCollaborationMember({
      member_id: "member-1",
    });

    expect(result.success).toBe(true);
    expect(result.member?.partnership_company).toBe("Tech Corp");
    expect(result.member?.partnership_type).toBe("corporate");
    expect(result.member?.partnership_contract_start).toBe("2025-01-01");
  });

  it("should mark partnership as ended when requested", async () => {
    const { supabase } = await import("@/lib/supabase");
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi
      .fn()
      .mockResolvedValue({ data: mockCollaborationMember, error: null });

    const mockUpdate = vi.fn().mockReturnThis();
    const mockUpdateEq = vi.fn().mockReturnThis();
    const mockUpdateSelect = vi.fn().mockReturnThis();
    const mockUpdateSingle = vi.fn().mockResolvedValue({
      data: {
        ...mockCollaborationMember,
        member_type: "full",
        partnership_contract_end: "2025-11-02",
      },
      error: null,
    });

    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === "members") {
        return {
          select: mockSelect,
          update: mockUpdate,
        };
      }
      return {};
    }) as any);

    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValue({
      single: mockSingle,
    });

    mockUpdate.mockReturnValue({
      eq: mockUpdateEq,
    });
    mockUpdateEq.mockReturnValue({
      select: mockUpdateSelect,
    });
    mockUpdateSelect.mockReturnValue({
      single: mockUpdateSingle,
    });

    const result = await convertCollaborationMember({
      member_id: "member-1",
      end_partnership: true,
    });

    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        partnership_contract_end: "2025-11-02",
      })
    );
  });

  it("should append conversion notes to member notes", async () => {
    const { supabase } = await import("@/lib/supabase");
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi
      .fn()
      .mockResolvedValue({ data: mockCollaborationMember, error: null });

    const mockUpdate = vi.fn().mockReturnThis();
    const mockUpdateEq = vi.fn().mockReturnThis();
    const mockUpdateSelect = vi.fn().mockReturnThis();
    const mockUpdateSingle = vi.fn().mockResolvedValue({
      data: {
        ...mockCollaborationMember,
        member_type: "full",
        notes:
          "Initial notes\n\n[Converted from collaboration to full member on 11/2/2025]: Partnership ended",
      },
      error: null,
    });

    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === "members") {
        return {
          select: mockSelect,
          update: mockUpdate,
        };
      }
      return {};
    }) as any);

    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValue({
      single: mockSingle,
    });

    mockUpdate.mockReturnValue({
      eq: mockUpdateEq,
    });
    mockUpdateEq.mockReturnValue({
      select: mockUpdateSelect,
    });
    mockUpdateSelect.mockReturnValue({
      single: mockUpdateSingle,
    });

    const result = await convertCollaborationMember({
      member_id: "member-1",
      conversion_notes: "Partnership ended",
    });

    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        notes: expect.stringContaining("Partnership ended"),
      })
    );
  });

  it("should reject non-collaboration members", async () => {
    const { supabase } = await import("@/lib/supabase");
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi
      .fn()
      .mockResolvedValue({ data: mockFullMember, error: null });

    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === "members") {
        return {
          select: mockSelect,
        };
      }
      return {};
    }) as any);

    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValue({
      single: mockSingle,
    });

    const result = await convertCollaborationMember({
      member_id: "member-2",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Member is not a collaboration member");
  });

  it("should handle member not found", async () => {
    const { supabase } = await import("@/lib/supabase");
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Not found" },
    });

    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === "members") {
        return {
          select: mockSelect,
        };
      }
      return {};
    }) as any);

    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValue({
      single: mockSingle,
    });

    const result = await convertCollaborationMember({
      member_id: "non-existent",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Member not found");
  });

  it("should handle update errors", async () => {
    const { supabase } = await import("@/lib/supabase");
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi
      .fn()
      .mockResolvedValue({ data: mockCollaborationMember, error: null });

    const mockUpdate = vi.fn().mockReturnThis();
    const mockUpdateEq = vi.fn().mockReturnThis();
    const mockUpdateSelect = vi.fn().mockReturnThis();
    const mockUpdateSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Update failed" },
    });

    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === "members") {
        return {
          select: mockSelect,
          update: mockUpdate,
        };
      }
      return {};
    }) as any);

    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValue({
      single: mockSingle,
    });

    mockUpdate.mockReturnValue({
      eq: mockUpdateEq,
    });
    mockUpdateEq.mockReturnValue({
      select: mockUpdateSelect,
    });
    mockUpdateSelect.mockReturnValue({
      single: mockUpdateSingle,
    });

    const result = await convertCollaborationMember({
      member_id: "member-1",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Failed to convert member");
  });
});
