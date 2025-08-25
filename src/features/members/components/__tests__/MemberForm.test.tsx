import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemberForm } from "../MemberForm";
import type { Member } from "@/features/database/lib/types";

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
  notes: "Test notes",
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

describe("MemberForm", () => {
  it("renders form fields for new member", () => {
    render(<MemberForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByLabelText("First Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Last Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
    expect(screen.getByText("Create Member")).toBeInTheDocument();
  });

  it("populates form fields when editing existing member", () => {
    render(
      <MemberForm member={mockMember} onSubmit={vi.fn()} onCancel={vi.fn()} />
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
    render(<MemberForm onSubmit={vi.fn()} onCancel={handleCancel} />);

    fireEvent.click(screen.getByText("Cancel"));
    expect(handleCancel).toHaveBeenCalled();
  });

  it("shows loading state when isLoading is true", () => {
    render(
      <MemberForm onSubmit={vi.fn()} onCancel={vi.fn()} isLoading={true} />
    );

    expect(screen.getByText("Saving...")).toBeInTheDocument();
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("validates required fields", async () => {
    const handleSubmit = vi.fn();
    render(<MemberForm onSubmit={handleSubmit} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /create member/i }));

    await waitFor(() => {
      expect(screen.getByText("First name is required")).toBeInTheDocument();
      expect(screen.getByText("Last name is required")).toBeInTheDocument();
    });

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("renders all form sections", () => {
    render(<MemberForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByText("Personal Information")).toBeInTheDocument();
    expect(screen.getByText("Contact Information")).toBeInTheDocument();
    expect(screen.getByText("Address")).toBeInTheDocument();
    expect(screen.getByText("Fitness & Health")).toBeInTheDocument();
    expect(screen.getByText("Status & Settings")).toBeInTheDocument();
  });

  it("handles checkbox fields correctly", () => {
    render(
      <MemberForm member={mockMember} onSubmit={vi.fn()} onCancel={vi.fn()} />
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
});
