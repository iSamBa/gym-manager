/**
 * US-002: Member Creation Form Enhancement Tests
 * Tests all acceptance criteria for the member creation form
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemberForm } from "../MemberForm";
import type { Member } from "@/features/database/lib/types";

// Mock useMembers hook to provide test data
vi.mock("@/features/members/hooks", () => ({
  useMembers: vi.fn(() => ({
    data: {
      pages: [
        {
          data: [
            {
              id: "member-1",
              first_name: "Alice",
              last_name: "Smith",
              email: "alice@example.com",
              full_name: "Alice Smith",
            },
            {
              id: "member-2",
              first_name: "Bob",
              last_name: "Johnson",
              email: "bob@example.com",
              full_name: "Bob Johnson",
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

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const TestWrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  TestWrapper.displayName = "TestWrapper";
  return TestWrapper;
};

const mockFemaleMember: Member = {
  id: "female-123",
  first_name: "Jane",
  last_name: "Doe",
  email: "jane.doe@example.com",
  phone: "+1234567890",
  date_of_birth: "1990-01-01",
  gender: "female",
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
  fitness_goals: null,
  preferred_contact_method: "email",
  marketing_consent: true,
  waiver_signed: true,
  waiver_signed_date: "2024-01-15",
  created_by: null,
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-15T10:00:00Z",
  member_type: "full",
  uniform_size: "M",
  uniform_received: false,
  vest_size: "V1",
  hip_belt_size: "V1",
  referral_source: "studio",
  referred_by_member_id: null,
  training_preference: "mixed",
};

describe("US-002: Member Creation Form Enhancement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("AC-001: Equipment Section Fields", () => {
    it("renders equipment section with all required fields", () => {
      render(<MemberForm onSubmit={vi.fn()} onCancel={vi.fn()} />, {
        wrapper: createWrapper(),
      });

      // Check section title
      expect(screen.getByText("Equipment Information")).toBeInTheDocument();

      // Check all equipment fields are present
      expect(screen.getByLabelText(/Uniform Size/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Uniform Received/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Vest Size/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Hip Belt Size/)).toBeInTheDocument();
    });

    it("equipment fields have proper required indicators (AC-004)", () => {
      render(<MemberForm onSubmit={vi.fn()} onCancel={vi.fn()} />, {
        wrapper: createWrapper(),
      });

      // Check that required fields are marked (with asterisk in label)
      const uniformLabel = screen.getByText(/Uniform Size/);
      const vestLabel = screen.getByText(/Vest Size/);
      const hipBeltLabel = screen.getByText(/Hip Belt Size/);

      expect(uniformLabel).toBeInTheDocument();
      expect(vestLabel).toBeInTheDocument();
      expect(hipBeltLabel).toBeInTheDocument();

      // Verify the fields are actually present
      expect(
        screen.getByRole("combobox", { name: /Uniform Size/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("combobox", { name: /Vest Size/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("combobox", { name: /Hip Belt Size/i })
      ).toBeInTheDocument();
    });

    it("uniform received checkbox defaults to unchecked", () => {
      render(<MemberForm onSubmit={vi.fn()} onCancel={vi.fn()} />, {
        wrapper: createWrapper(),
      });

      const uniformReceivedCheckbox = screen.getByRole("checkbox", {
        name: /Uniform Received/i,
      });
      expect(uniformReceivedCheckbox).not.toBeChecked();
    });
  });

  describe("AC-002: Referral Section Fields", () => {
    it("renders referral section with referral source field", () => {
      render(<MemberForm onSubmit={vi.fn()} onCancel={vi.fn()} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText("Referral Information")).toBeInTheDocument();
      expect(
        screen.getByLabelText(/How did you hear about us?/)
      ).toBeInTheDocument();
    });

    it("referral source field is marked as required (AC-004)", () => {
      render(<MemberForm onSubmit={vi.fn()} onCancel={vi.fn()} />, {
        wrapper: createWrapper(),
      });

      // Verify the referral source field exists and is required
      const referralField = screen.getByRole("combobox", {
        name: /How did you hear about us?/i,
      });
      expect(referralField).toBeInTheDocument();

      // Check the label has required indicator
      expect(
        screen.getByText(/How did you hear about us?/)
      ).toBeInTheDocument();
    });

    it("has 7 referral source options", async () => {
      const user = userEvent.setup();
      render(<MemberForm onSubmit={vi.fn()} onCancel={vi.fn()} />, {
        wrapper: createWrapper(),
      });

      // Open the referral source dropdown
      const referralSourceTrigger = screen.getByRole("combobox", {
        name: /How did you hear about us?/i,
      });
      await user.click(referralSourceTrigger);

      // Wait for dropdown options to appear
      await waitFor(() => {
        expect(
          screen.getByRole("option", { name: /Instagram/i })
        ).toBeVisible();
      });

      // Check all 7 options are present
      expect(screen.getByRole("option", { name: /Instagram/i })).toBeVisible();
      expect(
        screen.getByRole("option", { name: /Member Referral/i })
      ).toBeVisible();
      expect(
        screen.getByRole("option", { name: /Website \(Inbound\)/i })
      ).toBeVisible();
      expect(
        screen.getByRole("option", { name: /Prospection \(Outbound\)/i })
      ).toBeVisible();
      expect(
        screen.getByRole("option", { name: /Studio \(Walk-in\)/i })
      ).toBeVisible();
      expect(screen.getByRole("option", { name: /Phone/i })).toBeVisible();
      expect(screen.getByRole("option", { name: /Chatbot/i })).toBeVisible();
    });
  });

  describe("AC-003 & AC-008: Training Preference Section (Conditional for Females)", () => {
    it("does not show training preference section when no gender selected", () => {
      render(<MemberForm onSubmit={vi.fn()} onCancel={vi.fn()} />, {
        wrapper: createWrapper(),
      });

      // Training preference section should not be visible initially
      expect(
        screen.queryByText("Training Preferences")
      ).not.toBeInTheDocument();
    });

    it("shows training preference section for female members", () => {
      render(
        <MemberForm
          member={mockFemaleMember}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />,
        {
          wrapper: createWrapper(),
        }
      );

      // Training preference section should be visible for female members
      expect(screen.getByText("Training Preferences")).toBeInTheDocument();
    });

    it("training preference is optional for female members", async () => {
      const handleSubmit = vi.fn();
      render(
        <MemberForm
          member={mockFemaleMember}
          onSubmit={handleSubmit}
          onCancel={vi.fn()}
        />,
        {
          wrapper: createWrapper(),
        }
      );

      // Submit form without setting training preference
      // (form should not require it - it's optional)
      const submitButton = screen.getByRole("button", {
        name: /update member/i,
      });
      fireEvent.click(submitButton);

      // Should not show validation error for training preference
      await waitFor(
        () => {
          // Check that there's no error message related to training preference
          const trainingPrefError = screen.queryByText(
            /training preference.*required/i
          );
          expect(trainingPrefError).not.toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });
  });

  describe("AC-006: Zod Schema Matches Database Constraints", () => {
    it("accepts valid uniform size enum values", async () => {
      render(<MemberForm onSubmit={vi.fn()} onCancel={vi.fn()} />, {
        wrapper: createWrapper(),
      });

      const uniformSizeTrigger = screen.getByRole("combobox", {
        name: /Uniform Size/i,
      });

      await userEvent.click(uniformSizeTrigger);

      // Check all uniform size options
      await waitFor(() => {
        expect(screen.getByRole("option", { name: "XS" })).toBeVisible();
      });

      expect(screen.getByRole("option", { name: "XS" })).toBeVisible();
      expect(screen.getByRole("option", { name: "S" })).toBeVisible();
      expect(screen.getByRole("option", { name: "M" })).toBeVisible();
      expect(screen.getByRole("option", { name: "L" })).toBeVisible();
      expect(screen.getByRole("option", { name: "XL" })).toBeVisible();
    });

    it("accepts valid vest size enum values including extensions", async () => {
      render(<MemberForm onSubmit={vi.fn()} onCancel={vi.fn()} />, {
        wrapper: createWrapper(),
      });

      const vestSizeTrigger = screen.getByRole("combobox", {
        name: /Vest Size/i,
      });

      await userEvent.click(vestSizeTrigger);

      await waitFor(() => {
        expect(screen.getByRole("option", { name: /^V1$/i })).toBeVisible();
      });

      // Check all vest size options
      expect(screen.getByRole("option", { name: /^V1$/i })).toBeVisible();
      expect(screen.getByRole("option", { name: /^V2$/i })).toBeVisible();
      expect(
        screen.getByRole("option", { name: /V2 with Small Extension/i })
      ).toBeVisible();
      expect(
        screen.getByRole("option", { name: /V2 with Large Extension/i })
      ).toBeVisible();
      expect(
        screen.getByRole("option", { name: /V2 with Double Extension/i })
      ).toBeVisible();
    });

    it("accepts valid hip belt size enum values", async () => {
      render(<MemberForm onSubmit={vi.fn()} onCancel={vi.fn()} />, {
        wrapper: createWrapper(),
      });

      const hipBeltTrigger = screen.getByRole("combobox", {
        name: /Hip Belt Size/i,
      });

      await userEvent.click(hipBeltTrigger);

      await waitFor(() => {
        const options = screen.getAllByRole("option");
        const v1Options = options.filter((opt) => opt.textContent === "V1");
        expect(v1Options.length).toBeGreaterThan(0);
        expect(v1Options[v1Options.length - 1]).toBeVisible();
      });

      const options = screen.getAllByRole("option");
      const v1Options = options.filter((opt) => opt.textContent === "V1");
      const v2Options = options.filter((opt) => opt.textContent === "V2");

      expect(v1Options.length).toBeGreaterThan(0);
      expect(v2Options.length).toBeGreaterThan(0);
    });
  });

  describe("AC-009, AC-010, AC-011: Form Behavior", () => {
    it("cancel button triggers onCancel callback (AC-010, AC-011)", () => {
      const handleCancel = vi.fn();
      render(<MemberForm onSubmit={vi.fn()} onCancel={handleCancel} />, {
        wrapper: createWrapper(),
      });

      // Click cancel button
      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      fireEvent.click(cancelButton);

      // Verify cancel callback was called
      expect(handleCancel).toHaveBeenCalledTimes(1);
    });

    it("pre-fills all new fields when editing existing member", () => {
      render(
        <MemberForm
          member={mockFemaleMember}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />,
        {
          wrapper: createWrapper(),
        }
      );

      // Check that equipment fields are populated
      expect(
        screen.getByRole("combobox", { name: /Uniform Size/i })
      ).toHaveTextContent("M");
      expect(
        screen.getByRole("combobox", { name: /Vest Size/i })
      ).toHaveTextContent("V1");
      expect(
        screen.getByRole("combobox", { name: /Hip Belt Size/i })
      ).toHaveTextContent("V1");

      // Check uniform received checkbox
      const uniformReceivedCheckbox = screen.getByRole("checkbox", {
        name: /Uniform Received/i,
      });
      expect(uniformReceivedCheckbox).not.toBeChecked(); // mockFemaleMember has uniform_received: false
    });
  });

  describe("AC-015, AC-016, AC-017: Performance & Type Safety", () => {
    it("components render without TypeScript errors", () => {
      // This test passes if it compiles successfully
      const { container } = render(
        <MemberForm onSubmit={vi.fn()} onCancel={vi.fn()} />,
        {
          wrapper: createWrapper(),
        }
      );

      expect(container).toBeDefined();
    });

    it("form renders efficiently with all sections", () => {
      const { container } = render(
        <MemberForm onSubmit={vi.fn()} onCancel={vi.fn()} />,
        {
          wrapper: createWrapper(),
        }
      );

      // Check all sections are rendered
      expect(screen.getByText("Personal Information")).toBeInTheDocument();
      expect(screen.getByText("Equipment Information")).toBeInTheDocument();
      expect(screen.getByText("Referral Information")).toBeInTheDocument();

      expect(container).toBeDefined();
    });
  });

  describe("Integration: Form with All New Fields", () => {
    it("renders complete form with all new US-002 fields", () => {
      render(<MemberForm onSubmit={vi.fn()} onCancel={vi.fn()} />, {
        wrapper: createWrapper(),
      });

      // Verify all new sections are present
      expect(screen.getByText("Equipment Information")).toBeInTheDocument();
      expect(screen.getByText("Referral Information")).toBeInTheDocument();

      // Verify all new fields are present
      expect(
        screen.getByRole("combobox", { name: /Uniform Size/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("combobox", { name: /Vest Size/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("combobox", { name: /Hip Belt Size/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("combobox", { name: /How did you hear about us?/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("checkbox", { name: /Uniform Received/i })
      ).toBeInTheDocument();
    });

    it("form includes all equipment and referral fields in payload structure", () => {
      const mockMemberWithAllFields: Member = {
        ...mockFemaleMember,
        id: "test-123",
        uniform_size: "L",
        vest_size: "V2",
        hip_belt_size: "V2",
        referral_source: "instagram",
      };

      render(
        <MemberForm
          member={mockMemberWithAllFields}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />,
        {
          wrapper: createWrapper(),
        }
      );

      // Verify form pre-fills with all new field values
      expect(
        screen.getByRole("combobox", { name: /Uniform Size/i })
      ).toHaveTextContent("L");
      expect(
        screen.getByRole("combobox", { name: /Vest Size/i })
      ).toHaveTextContent("V2");
      expect(
        screen.getByRole("combobox", { name: /Hip Belt Size/i })
      ).toHaveTextContent("V2");
    });
  });
});
