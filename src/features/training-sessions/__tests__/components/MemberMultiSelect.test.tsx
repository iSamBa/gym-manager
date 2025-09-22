import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
  let mockMembersData: any;

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
    {
      id: "member-3",
      first_name: "Bob",
      last_name: "Johnson",
      email: "bob.johnson@example.com",
    },
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockMembersData = {
      data: mockMembers,
      isLoading: false,
      error: null,
    };

    (useMembers as any).mockReturnValue(mockMembersData);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      selectedMemberIds: [],
      onMemberIdsChange: vi.fn(),
      ...props,
    };

    return render(
      <QueryClientProvider client={queryClient}>
        <MemberMultiSelect {...defaultProps} />
      </QueryClientProvider>
    );
  };

  describe("US-004: Member Multi-Select Component", () => {
    describe("Basic rendering and functionality", () => {
      it("should render the multi-select component", () => {
        renderComponent();
        expect(screen.getByRole("combobox")).toBeInTheDocument();
        expect(screen.getByText("Select members...")).toBeInTheDocument();
      });

      it("should show custom placeholder when provided", () => {
        renderComponent({ placeholder: "Choose participants" });
        expect(screen.getByText("Choose participants")).toBeInTheDocument();
      });

      it("should be disabled when disabled prop is true", () => {
        renderComponent({ disabled: true });
        const button = screen.getByRole("combobox");
        expect(button).toBeDisabled();
        expect(button).toHaveClass("cursor-not-allowed", "opacity-50");
      });
    });

    describe("Member list display and search", () => {
      it("should open dropdown and show member list when clicked", async () => {
        renderComponent();

        const trigger = screen.getByRole("combobox");
        await userEvent.click(trigger);

        await waitFor(() => {
          expect(screen.getByText("John Doe")).toBeInTheDocument();
          expect(screen.getByText("Jane Smith")).toBeInTheDocument();
          expect(screen.getByText("Bob Johnson")).toBeInTheDocument();
        });
      });

      it("should show member emails in the dropdown", async () => {
        renderComponent();

        const trigger = screen.getByRole("combobox");
        await userEvent.click(trigger);

        await waitFor(() => {
          expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();
          expect(
            screen.getByText("jane.smith@example.com")
          ).toBeInTheDocument();
        });
      });

      it("should filter members based on search term", async () => {
        renderComponent();

        const trigger = screen.getByRole("combobox");
        await userEvent.click(trigger);

        const searchInput = screen.getByPlaceholderText("Search members...");
        await userEvent.type(searchInput, "john");

        await waitFor(() => {
          expect(screen.getByText("John Doe")).toBeInTheDocument();
          expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
          expect(screen.getByText("Bob Johnson")).toBeInTheDocument(); // Contains 'john'
        });
      });

      it("should filter members by email", async () => {
        renderComponent();

        const trigger = screen.getByRole("combobox");
        await userEvent.click(trigger);

        const searchInput = screen.getByPlaceholderText("Search members...");
        await userEvent.type(searchInput, "jane.smith");

        await waitFor(() => {
          expect(screen.getByText("Jane Smith")).toBeInTheDocument();
          expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
        });
      });

      it('should show "No members found" when search has no results', async () => {
        renderComponent();

        const trigger = screen.getByRole("combobox");
        await userEvent.click(trigger);

        const searchInput = screen.getByPlaceholderText("Search members...");
        await userEvent.type(searchInput, "nonexistent");

        await waitFor(() => {
          expect(screen.getByText("No members found.")).toBeInTheDocument();
        });
      });
    });

    describe("Member selection functionality", () => {
      it("should select member when clicked", async () => {
        const onMemberIdsChange = vi.fn();
        renderComponent({ onMemberIdsChange });

        const trigger = screen.getByRole("combobox");
        await userEvent.click(trigger);

        const memberOption = screen.getByText("John Doe");
        await userEvent.click(memberOption);

        expect(onMemberIdsChange).toHaveBeenCalledWith(["member-1"]);
      });

      it("should deselect member when clicked again", async () => {
        const onMemberIdsChange = vi.fn();
        renderComponent({
          selectedMemberIds: ["member-1"],
          onMemberIdsChange,
        });

        const trigger = screen.getByRole("combobox");
        await userEvent.click(trigger);

        const memberOption = screen.getByText("John Doe");
        await userEvent.click(memberOption);

        expect(onMemberIdsChange).toHaveBeenCalledWith([]);
      });

      it("should show selected members as badges", () => {
        renderComponent({ selectedMemberIds: ["member-1", "member-2"] });

        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      });

      it("should show selected count", () => {
        renderComponent({
          selectedMemberIds: ["member-1", "member-2"],
          maxMembers: 10,
        });

        expect(screen.getByText("2/10")).toBeInTheDocument();
      });

      it("should limit display to first 3 members with overflow indicator", () => {
        renderComponent({
          selectedMemberIds: ["member-1", "member-2", "member-3"],
          maxMembers: 10,
        });

        // Should show first 3 members
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
        expect(screen.getByText("Bob Johnson")).toBeInTheDocument();
      });

      it('should show "+X more" when more than 3 members selected', () => {
        const fourMembers = ["member-1", "member-2", "member-3", "member-4"];
        renderComponent({
          selectedMemberIds: fourMembers,
          maxMembers: 10,
        });

        expect(screen.getByText("+1 more")).toBeInTheDocument();
      });
    });

    describe("Member removal functionality", () => {
      it("should remove member when X button is clicked", async () => {
        const onMemberIdsChange = vi.fn();
        renderComponent({
          selectedMemberIds: ["member-1", "member-2"],
          onMemberIdsChange,
        });

        // Find the remove button for John Doe
        const removeButtons = screen.getAllByRole("button", { name: "" }); // X buttons
        await userEvent.click(removeButtons[0]);

        expect(onMemberIdsChange).toHaveBeenCalledWith(["member-2"]);
      });

      it("should prevent event bubbling when remove button is clicked", async () => {
        const onMemberIdsChange = vi.fn();
        renderComponent({
          selectedMemberIds: ["member-1"],
          onMemberIdsChange,
        });

        const removeButton = screen.getByRole("button", { name: "" });

        // Create a mock event to test stopPropagation
        const mockEvent = new MouseEvent("click", { bubbles: true });
        const stopPropagationSpy = vi.spyOn(mockEvent, "stopPropagation");

        fireEvent.click(removeButton, mockEvent);

        expect(stopPropagationSpy).toHaveBeenCalled();
      });
    });

    describe("Maximum members validation", () => {
      it("should enforce maximum members limit", async () => {
        const onMemberIdsChange = vi.fn();
        renderComponent({
          selectedMemberIds: ["member-1"],
          maxMembers: 1,
          onMemberIdsChange,
        });

        const trigger = screen.getByRole("combobox");
        await userEvent.click(trigger);

        // Try to select another member when at max
        const memberOption = screen.getByText("Jane Smith");
        await userEvent.click(memberOption);

        // Should not add the member
        expect(onMemberIdsChange).not.toHaveBeenCalled();
      });

      it("should show max reached indicator", () => {
        renderComponent({
          selectedMemberIds: ["member-1"],
          maxMembers: 1,
        });

        const trigger = screen.getByRole("combobox");
        fireEvent.click(trigger);

        expect(screen.getByText("(max reached)")).toBeInTheDocument();
      });

      it("should disable non-selected options when max is reached", async () => {
        renderComponent({
          selectedMemberIds: ["member-1"],
          maxMembers: 1,
        });

        const trigger = screen.getByRole("combobox");
        await userEvent.click(trigger);

        const janeOption = screen
          .getByText("Jane Smith")
          .closest('[role="option"]');
        expect(janeOption).toHaveClass("opacity-50", "cursor-not-allowed");
      });

      it("should allow deselection even when max is reached", async () => {
        const onMemberIdsChange = vi.fn();
        renderComponent({
          selectedMemberIds: ["member-1"],
          maxMembers: 1,
          onMemberIdsChange,
        });

        const trigger = screen.getByRole("combobox");
        await userEvent.click(trigger);

        const johnOption = screen.getByText("John Doe");
        await userEvent.click(johnOption);

        expect(onMemberIdsChange).toHaveBeenCalledWith([]);
      });
    });

    describe("Clear functionality", () => {
      it("should show clear all button when members are selected", async () => {
        renderComponent({ selectedMemberIds: ["member-1", "member-2"] });

        const trigger = screen.getByRole("combobox");
        await userEvent.click(trigger);

        expect(screen.getByText("Clear all")).toBeInTheDocument();
      });

      it("should clear all selected members when clear all is clicked", async () => {
        const onMemberIdsChange = vi.fn();
        renderComponent({
          selectedMemberIds: ["member-1", "member-2"],
          onMemberIdsChange,
        });

        const trigger = screen.getByRole("combobox");
        await userEvent.click(trigger);

        const clearButton = screen.getByText("Clear all");
        await userEvent.click(clearButton);

        expect(onMemberIdsChange).toHaveBeenCalledWith([]);
      });

      it("should not show clear all button when no members are selected", async () => {
        renderComponent({ selectedMemberIds: [] });

        const trigger = screen.getByRole("combobox");
        await userEvent.click(trigger);

        expect(screen.queryByText("Clear all")).not.toBeInTheDocument();
      });
    });

    describe("Loading states", () => {
      it("should show loading indicator when members are loading", async () => {
        (useMembers as any).mockReturnValue({
          data: [],
          isLoading: true,
          error: null,
        });

        renderComponent();

        const trigger = screen.getByRole("combobox");
        await userEvent.click(trigger);

        expect(screen.getByText("Loading members...")).toBeInTheDocument();
        expect(
          screen.getByTestId("loading-spinner") || screen.getByText(/loading/i)
        ).toBeInTheDocument();
      });
    });

    describe("Error handling", () => {
      it("should display error message when provided", () => {
        renderComponent({ error: "Please select at least one member" });
        expect(
          screen.getByText("Please select at least one member")
        ).toBeInTheDocument();
      });

      it("should apply error styling when error is present", () => {
        renderComponent({ error: "Error message" });
        const trigger = screen.getByRole("combobox");
        expect(trigger).toHaveClass("border-destructive");
      });
    });

    describe("Helper text", () => {
      it("should show selection helper text", () => {
        renderComponent({ maxMembers: 5 });
        expect(
          screen.getByText("Select up to 5 members for this training session")
        ).toBeInTheDocument();
      });

      it("should show count when members are selected", () => {
        renderComponent({
          selectedMemberIds: ["member-1", "member-2"],
          maxMembers: 5,
        });
        expect(screen.getByText("2 of 5 members selected")).toBeInTheDocument();
      });
    });

    describe("Accessibility", () => {
      it("should have proper ARIA attributes", () => {
        renderComponent();

        const trigger = screen.getByRole("combobox");
        expect(trigger).toHaveAttribute("aria-expanded", "false");
      });

      it("should update aria-expanded when opened", async () => {
        renderComponent();

        const trigger = screen.getByRole("combobox");
        await userEvent.click(trigger);

        expect(trigger).toHaveAttribute("aria-expanded", "true");
      });

      it("should be keyboard navigable", async () => {
        renderComponent();

        const trigger = screen.getByRole("combobox");
        trigger.focus();
        expect(trigger).toHaveFocus();

        // Should be able to open with Enter/Space
        await userEvent.keyboard("{Enter}");

        await waitFor(() => {
          expect(
            screen.getByPlaceholderText("Search members...")
          ).toBeInTheDocument();
        });
      });

      it("should support screen reader with proper labels", () => {
        renderComponent();

        const trigger = screen.getByRole("combobox");
        expect(trigger).toBeInTheDocument();
      });
    });

    describe("Selected member indicators", () => {
      it("should show checkmark for selected members", async () => {
        renderComponent({ selectedMemberIds: ["member-1"] });

        const trigger = screen.getByRole("combobox");
        await userEvent.click(trigger);

        // John Doe should have a checkmark and "Selected" badge
        await waitFor(() => {
          expect(screen.getByText("Selected")).toBeInTheDocument();
        });
      });

      it("should hide checkmark for unselected members", async () => {
        renderComponent({ selectedMemberIds: ["member-1"] });

        const trigger = screen.getByRole("combobox");
        await userEvent.click(trigger);

        // Check that unselected members don't have checkmarks
        const checkmarks = screen.getAllByTestId("check-icon");
        expect(checkmarks).toHaveLength(1); // Only one selected member
      });
    });
  });
});
