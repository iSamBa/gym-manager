import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemberTable } from "../member-table";
import { createQueryWrapper } from "@/test/query-test-utils";
import type { Member } from "@/features/database/lib/types";

vi.mock("@/features/members/hooks", () => ({
  useUpdateMemberStatus: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockMembers: Member[] = [
  {
    id: "1",
    member_number: "MEM001",
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    phone: "+1234567890",
    date_of_birth: "1990-01-01",
    gender: "male",
    address: {
      street: "123 Main St",
      city: "Anytown",
      state: "CA",
      postal_code: "12345",
      country: "USA",
    },
    status: "active",
    join_date: "2024-01-15",
    notes: null,
    medical_conditions: null,
    fitness_goals: "Weight loss",
    preferred_contact_method: "email",
    marketing_consent: true,
    waiver_signed: true,
    waiver_signed_date: "2024-01-15",
    created_by: null,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    member_number: "MEM002",
    first_name: "Jane",
    last_name: "Smith",
    email: "jane.smith@example.com",
    phone: null,
    date_of_birth: "1985-05-20",
    gender: "female",
    address: {
      street: "456 Oak Ave",
      city: "Another City",
      state: "NY",
      postal_code: "67890",
      country: "USA",
    },
    status: "inactive",
    join_date: "2024-02-01",
    notes: null,
    medical_conditions: null,
    fitness_goals: null,
    preferred_contact_method: "phone",
    marketing_consent: false,
    waiver_signed: true,
    waiver_signed_date: "2024-02-01",
    created_by: null,
    created_at: "2024-02-01T10:00:00Z",
    updated_at: "2024-02-01T10:00:00Z",
  },
];

describe("MemberTable", () => {
  it("renders table with member data", () => {
    render(<MemberTable members={mockMembers} />, {
      wrapper: createQueryWrapper(),
    });

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();
    expect(screen.getByText("MEM001")).toBeInTheDocument();
    expect(screen.getByText("MEM002")).toBeInTheDocument();
  });

  it("shows action buttons when showActions is true", () => {
    render(<MemberTable members={mockMembers} showActions />, {
      wrapper: createQueryWrapper(),
    });

    const actionButtons = screen.getAllByRole("button", { name: /open menu/i });
    expect(actionButtons).toHaveLength(2);
  });

  it("hides action buttons when showActions is false", () => {
    render(<MemberTable members={mockMembers} showActions={false} />, {
      wrapper: createQueryWrapper(),
    });

    expect(
      screen.queryByRole("button", { name: /open menu/i })
    ).not.toBeInTheDocument();
  });

  it("displays member initials in avatars", () => {
    render(<MemberTable members={mockMembers} />, {
      wrapper: createQueryWrapper(),
    });

    expect(screen.getByText("JD")).toBeInTheDocument();
    expect(screen.getByText("JS")).toBeInTheDocument();
  });

  it("handles missing phone numbers gracefully", () => {
    render(<MemberTable members={mockMembers} />, {
      wrapper: createQueryWrapper(),
    });

    expect(screen.getByText("Not provided")).toBeInTheDocument();
  });

  it("displays status badges correctly", () => {
    render(<MemberTable members={mockMembers} />, {
      wrapper: createQueryWrapper(),
    });

    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("formats join dates correctly", () => {
    render(<MemberTable members={mockMembers} />, {
      wrapper: createQueryWrapper(),
    });

    expect(screen.getByText("Jan 15, 2024")).toBeInTheDocument();
    expect(screen.getByText("Feb 1, 2024")).toBeInTheDocument();
  });

  it("renders empty table when no members provided", () => {
    render(<MemberTable members={[]} />, { wrapper: createQueryWrapper() });

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
  });
});
