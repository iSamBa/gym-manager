import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { MemberMultiSelect } from "../../components/forms/MemberMultiSelect";

// Mock the hook
vi.mock("../../hooks/use-members", () => ({
  useMembers: vi.fn(),
}));

import { useMembers } from "../../hooks/use-members";

describe("MemberMultiSelect", () => {
  let queryClient: QueryClient;

  const mockMembers = [
    {
      id: "member-1",
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@example.com",
    },
    {
      id: "member-2",
      first_name: "Jane",
      last_name: "Smith",
      email: "jane.smith@example.com",
    },
  ];

  const defaultProps = {
    selectedMemberIds: [],
    onMemberIdsChange: vi.fn(),
    maxMembers: 50,
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    (useMembers as any).mockReturnValue({
      data: mockMembers,
      isLoading: false,
      error: null,
    });

    vi.clearAllMocks();
  });

  const renderWithQueryClient = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    );
  };

  describe("Basic Functionality", () => {
    it("should render the multi-select component", () => {
      renderWithQueryClient(<MemberMultiSelect {...defaultProps} />);

      expect(screen.getByText("Select members...")).toBeInTheDocument();
    });

    it("should show member count when members are selected", () => {
      const propsWithSelectedMembers = {
        ...defaultProps,
        selectedMemberIds: ["member-1"],
      };

      renderWithQueryClient(
        <MemberMultiSelect {...propsWithSelectedMembers} />
      );

      expect(screen.getByText("1 of 50 members selected")).toBeInTheDocument();
    });

    it("should display error message when provided", () => {
      const propsWithError = {
        ...defaultProps,
        error: "This field is required",
      };

      renderWithQueryClient(<MemberMultiSelect {...propsWithError} />);

      expect(screen.getByText("This field is required")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes", () => {
      renderWithQueryClient(<MemberMultiSelect {...defaultProps} />);

      const combobox = screen.getByRole("combobox");
      expect(combobox).toHaveAttribute("aria-expanded", "false");
    });

    it("should support screen reader with proper labels", () => {
      renderWithQueryClient(<MemberMultiSelect {...defaultProps} />);

      expect(screen.getByText("Select members...")).toBeInTheDocument();
    });
  });
});
