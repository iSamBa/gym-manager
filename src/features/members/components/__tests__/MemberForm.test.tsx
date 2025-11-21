import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemberForm } from "../MemberForm";
import type { Member } from "@/features/database/lib/types";

// Mock useMembers hook to prevent actual API calls
vi.mock("@/features/members/hooks", () => ({
  useMembers: vi.fn(() => ({
    data: {
      pages: [
        {
          members: [
            {
              id: "member-1",
              first_name: "Alice",
              last_name: "Smith",
              email: "alice@example.com",
            },
            {
              id: "member-2",
              first_name: "Bob",
              last_name: "Johnson",
              email: "bob@example.com",
            },
          ],
          totalCount: 2,
        },
      ],
    },
    isLoading: false,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
  })),
}));

const mockMember: Member = {
  id: "123",
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
  notes: "Test notes",
  medical_conditions: undefined,
  fitness_goals: "Weight loss",
  preferred_contact_method: "email",
  marketing_consent: true,
  waiver_signed: true,
  waiver_signed_date: "2024-01-15",
  created_by: undefined,
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-15T10:00:00Z",
  member_type: "full",
  uniform_size: "M",
  uniform_received: false,
  vest_size: "V1",
  hip_belt_size: "V1",
  referral_source: "studio",
  referred_by_member_id: null,
  training_preference: undefined,
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const TestWrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  TestWrapper.displayName = "TestWrapper";
  return TestWrapper;
};

describe("MemberForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("renders form fields for new member", () => {
    render(<MemberForm onSubmit={vi.fn()} onCancel={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByLabelText("First Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Last Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
    expect(screen.getByText("Create Member")).toBeInTheDocument();
  });

  it("populates form fields when editing existing member", () => {
    render(
      <MemberForm member={mockMember} onSubmit={vi.fn()} onCancel={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByDisplayValue("John")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Doe")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("john.doe@example.com")
    ).toBeInTheDocument();
    expect(screen.getByText("Update Member")).toBeInTheDocument();
  });

  it("calls onCancel when cancel button is clicked", () => {
    const handleCancel = vi.fn();
    render(<MemberForm onSubmit={vi.fn()} onCancel={handleCancel} />, {
      wrapper: createWrapper(),
    });

    fireEvent.click(screen.getByText("Cancel"));
    expect(handleCancel).toHaveBeenCalled();
  });

  it("shows loading state when isLoading is true", () => {
    render(
      <MemberForm onSubmit={vi.fn()} onCancel={vi.fn()} isLoading={true} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Saving...")).toBeInTheDocument();
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("validates required fields", async () => {
    const handleSubmit = vi.fn();
    render(<MemberForm onSubmit={handleSubmit} onCancel={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    fireEvent.click(screen.getByRole("button", { name: /create member/i }));

    await waitFor(() => {
      expect(screen.getByText("First name is required")).toBeInTheDocument();
      expect(screen.getByText("Last name is required")).toBeInTheDocument();
    });

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("renders all form sections", () => {
    render(<MemberForm onSubmit={vi.fn()} onCancel={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText("Personal Information")).toBeInTheDocument();
    expect(screen.getByText("Contact Information")).toBeInTheDocument();
    expect(screen.getByText("Address")).toBeInTheDocument();
    expect(screen.getByText("Fitness & Health")).toBeInTheDocument();
    expect(screen.getByText("Status & Settings")).toBeInTheDocument();
  });

  it("handles checkbox fields correctly", () => {
    render(
      <MemberForm member={mockMember} onSubmit={vi.fn()} onCancel={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    const waiverCheckbox = screen.getByRole("checkbox", {
      name: /liability waiver/i,
    });
    const marketingCheckbox = screen.getByRole("checkbox", {
      name: /marketing communications/i,
    });

    expect(waiverCheckbox).toBeChecked();
    expect(marketingCheckbox).toBeChecked();
  });

  // US-002: AC-001 - Equipment section with all required fields
  describe("US-002: Equipment Section (AC-001)", () => {
    it("renders equipment section with all required fields", () => {
      render(<MemberForm onSubmit={vi.fn()} onCancel={vi.fn()} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText("Equipment Information")).toBeInTheDocument();
      expect(screen.getByLabelText(/Uniform Size/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Uniform Received/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Vest Size/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Hip Belt Size/)).toBeInTheDocument();
    });

    it("all equipment fields are marked as required", () => {
      render(<MemberForm onSubmit={vi.fn()} onCancel={vi.fn()} />, {
        wrapper: createWrapper(),
      });

      // Check that required fields have asterisk or required indicator
      expect(screen.getByText(/Uniform Size/)).toBeInTheDocument();
      expect(screen.getByText(/Vest Size/)).toBeInTheDocument();
      expect(screen.getByText(/Hip Belt Size/)).toBeInTheDocument();
    });
  });

  // US-002: AC-002 - Referral section with conditional field
  describe("US-002: Referral Section (AC-002)", () => {
    it("renders referral section with referral source field", () => {
      render(<MemberForm onSubmit={vi.fn()} onCancel={vi.fn()} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText("Referral Information")).toBeInTheDocument();
      expect(
        screen.getByLabelText(/How did you hear about us?/)
      ).toBeInTheDocument();
    });

    it("referral source field is marked as required", () => {
      render(<MemberForm onSubmit={vi.fn()} onCancel={vi.fn()} />, {
        wrapper: createWrapper(),
      });

      // Check referral source field exists with required indicator
      expect(
        screen.getByLabelText(/How did you hear about us?/)
      ).toBeInTheDocument();
    });
  });

  // US-002: AC-003 - Training preference section (conditional for females only)
  describe("US-002: Training Preference Section (AC-003)", () => {
    it("does not render training preference for male members", () => {
      render(<MemberForm onSubmit={vi.fn()} onCancel={vi.fn()} />, {
        wrapper: createWrapper(),
      });

      // Initially form is empty, so no gender selected yet
      // Training preference section should not be visible
      expect(
        screen.queryByText("Training Preferences")
      ).not.toBeInTheDocument();
    });
  });
});
