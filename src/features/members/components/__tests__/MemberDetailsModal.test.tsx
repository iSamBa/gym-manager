import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemberDetailsModal } from "../MemberDetailsModal";
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

const mockMember: Member = {
  id: "123",
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
  notes: "Test member notes",
  medical_conditions: "None",
  fitness_goals: "Weight loss and muscle gain",
  preferred_contact_method: "email",
  marketing_consent: true,
  waiver_signed: true,
  waiver_signed_date: "2024-01-15",
  created_by: null,
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-15T10:00:00Z",
};

describe("MemberDetailsModal", () => {
  it("renders member details when open", () => {
    render(
      <MemberDetailsModal
        member={mockMember}
        isOpen={true}
        onClose={vi.fn()}
      />,
      { wrapper: createQueryWrapper() }
    );

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Member #MEM001")).toBeInTheDocument();
    expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();
    expect(screen.getByText("+1234567890")).toBeInTheDocument();
  });

  it("does not render when member is null", () => {
    render(
      <MemberDetailsModal member={null} isOpen={true} onClose={vi.fn()} />,
      { wrapper: createQueryWrapper() }
    );

    expect(screen.queryByText("Contact Information")).not.toBeInTheDocument();
  });

  it("displays member avatar with initials", () => {
    render(
      <MemberDetailsModal
        member={mockMember}
        isOpen={true}
        onClose={vi.fn()}
      />,
      { wrapper: createQueryWrapper() }
    );

    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("shows edit button when onEdit is provided", () => {
    const handleEdit = vi.fn();
    render(
      <MemberDetailsModal
        member={mockMember}
        isOpen={true}
        onClose={vi.fn()}
        onEdit={handleEdit}
      />,
      { wrapper: createQueryWrapper() }
    );

    expect(screen.getByText("Edit")).toBeInTheDocument();
  });

  it("hides edit button when onEdit is not provided", () => {
    render(
      <MemberDetailsModal
        member={mockMember}
        isOpen={true}
        onClose={vi.fn()}
      />,
      { wrapper: createQueryWrapper() }
    );

    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
  });

  it("displays fitness goals when provided", () => {
    render(
      <MemberDetailsModal
        member={mockMember}
        isOpen={true}
        onClose={vi.fn()}
      />,
      { wrapper: createQueryWrapper() }
    );

    expect(screen.getByText("Fitness Goals")).toBeInTheDocument();
    expect(screen.getByText("Weight loss and muscle gain")).toBeInTheDocument();
  });

  it("displays medical conditions when provided", () => {
    render(
      <MemberDetailsModal
        member={mockMember}
        isOpen={true}
        onClose={vi.fn()}
      />,
      { wrapper: createQueryWrapper() }
    );

    expect(screen.getByText("Medical Conditions")).toBeInTheDocument();
    expect(screen.getByText("None")).toBeInTheDocument();
  });

  it("displays compliance information", () => {
    render(
      <MemberDetailsModal
        member={mockMember}
        isOpen={true}
        onClose={vi.fn()}
      />,
      { wrapper: createQueryWrapper() }
    );

    expect(screen.getByText("Compliance")).toBeInTheDocument();
    expect(screen.getByText("Waiver Signed:")).toBeInTheDocument();
    expect(screen.getByText("Marketing Consent:")).toBeInTheDocument();
  });

  it("handles missing optional data gracefully", () => {
    const memberWithoutOptionalData = {
      ...mockMember,
      phone: null,
      fitness_goals: null,
      medical_conditions: null,
      notes: null,
    };

    render(
      <MemberDetailsModal
        member={memberWithoutOptionalData}
        isOpen={true}
        onClose={vi.fn()}
      />,
      { wrapper: createQueryWrapper() }
    );

    expect(screen.getByText("Not provided")).toBeInTheDocument();
    expect(screen.queryByText("Fitness Goals")).not.toBeInTheDocument();
    expect(screen.queryByText("Medical Conditions")).not.toBeInTheDocument();
    expect(screen.queryByText("Notes")).not.toBeInTheDocument();
  });
});
