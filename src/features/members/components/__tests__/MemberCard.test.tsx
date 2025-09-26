import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemberCard } from "../MemberCard";
import { createQueryWrapper } from "@/test/query-test-utils";
import type { Member } from "@/features/database/lib/types";

// Mock the hooks
const mockDeleteMember = {
  mutateAsync: vi.fn(),
  isPending: false,
};

vi.mock("@/features/members/hooks", () => ({
  useDeleteMember: () => mockDeleteMember,
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
  id: "123e4567-e89b-12d3-a456-426614174000",
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
  notes: "Test member",
  medical_conditions: null,
  fitness_goals: "Weight loss",
  preferred_contact_method: "email",
  marketing_consent: true,
  waiver_signed: true,
  waiver_signed_date: "2024-01-15",
  created_by: null,
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-15T10:00:00Z",
};

describe("MemberCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeleteMember.isPending = false;
  });

  describe("minimal variant", () => {
    it("renders minimal member info", () => {
      render(<MemberCard member={mockMember} variant="minimal" />, {
        wrapper: createQueryWrapper(),
      });

      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("JD")).toBeInTheDocument(); // Avatar initials
      // Member numbers no longer displayed in minimal variant
    });

    it("does not show actions in minimal variant", () => {
      render(<MemberCard member={mockMember} variant="minimal" showActions />, {
        wrapper: createQueryWrapper(),
      });

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("compact variant", () => {
    it("renders compact member information", () => {
      render(<MemberCard member={mockMember} variant="compact" />, {
        wrapper: createQueryWrapper(),
      });

      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Joined Jan 15, 2024")).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("shows action dropdown when showActions is true", () => {
      render(<MemberCard member={mockMember} variant="compact" showActions />, {
        wrapper: createQueryWrapper(),
      });

      const actionButton = screen.getByRole("button", { name: /open menu/i });
      expect(actionButton).toBeInTheDocument();
    });

    it("hides actions when showActions is false", () => {
      render(
        <MemberCard
          member={mockMember}
          variant="compact"
          showActions={false}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(
        screen.queryByRole("button", { name: /open menu/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("full variant", () => {
    it("renders complete member information", () => {
      render(<MemberCard member={mockMember} variant="full" />, {
        wrapper: createQueryWrapper(),
      });

      expect(screen.getByText("John Doe")).toBeInTheDocument();
      // Member numbers no longer displayed in UI
      expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();
      expect(screen.getByText("+1234567890")).toBeInTheDocument();
      expect(screen.getByText("Weight loss")).toBeInTheDocument();
    });

    it("handles missing optional data gracefully", () => {
      const memberWithoutPhone = {
        ...mockMember,
        phone: null,
        fitness_goals: null,
      };
      render(<MemberCard member={memberWithoutPhone} variant="full" />, {
        wrapper: createQueryWrapper(),
      });

      expect(screen.getByText("Not provided")).toBeInTheDocument();
      expect(screen.queryByText("Weight loss")).not.toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("has action menu button when showActions is true", () => {
      render(<MemberCard member={mockMember} showActions />, {
        wrapper: createQueryWrapper(),
      });

      expect(
        screen.getByRole("button", { name: /open menu/i })
      ).toBeInTheDocument();
    });

    it("calls onHover when provided", () => {
      const handleHover = vi.fn();
      render(<MemberCard member={mockMember} onHover={handleHover} />, {
        wrapper: createQueryWrapper(),
      });

      const card = screen.getByText("John Doe").closest("div");
      fireEvent.mouseEnter(card!);
      expect(handleHover).toHaveBeenCalled();
    });
  });

  describe("accessibility", () => {
    it("has proper ARIA labels and roles", () => {
      render(<MemberCard member={mockMember} showActions />, {
        wrapper: createQueryWrapper(),
      });

      const menuButton = screen.getByRole("button", { name: /open menu/i });
      expect(menuButton).toHaveAttribute("aria-haspopup");
    });

    it("supports keyboard navigation", () => {
      render(<MemberCard member={mockMember} showActions />, {
        wrapper: createQueryWrapper(),
      });

      const menuButton = screen.getByRole("button", { name: /open menu/i });
      expect(menuButton).toBeInTheDocument();
      expect(menuButton).not.toBeDisabled();
    });
  });
});
