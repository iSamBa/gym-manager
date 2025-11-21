import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdvancedMemberTable } from "../AdvancedMemberTable";
import { createQueryWrapper } from "@/test/query-test-utils";
import type { Member } from "@/features/database/lib/types";

// Mock the hooks
const mockMembers: Member[] = [
  {
    id: "1",
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
    notes: undefined,
    medical_conditions: undefined,
    fitness_goals: undefined,
    preferred_contact_method: "email",
    marketing_consent: true,
    waiver_signed: true,
    waiver_signed_date: "2024-01-15",
    created_by: undefined,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    first_name: "Jane",
    last_name: "Smith",
    email: "jane.smith@example.com",
    phone: undefined,
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
    notes: undefined,
    medical_conditions: undefined,
    fitness_goals: undefined,
    preferred_contact_method: "phone",
    marketing_consent: false,
    waiver_signed: true,
    waiver_signed_date: "2024-02-01",
    created_by: undefined,
    created_at: "2024-02-01T10:00:00Z",
    updated_at: "2024-02-01T10:00:00Z",
  },
];

const mockMembersInfinite = {
  data: {
    pages: [mockMembers],
  },
  fetchNextPage: vi.fn(),
  hasNextPage: true,
  isFetchingNextPage: false,
  isLoading: false,
  isError: false,
  isFetching: false,
  refetch: vi.fn(),
};

const mockBulkUpdate = {
  mutateAsync: vi.fn(),
  isPending: false,
};

const mockDeleteMember = {
  mutateAsync: vi.fn(),
  isPending: false,
};

const mockMembersQuery = {
  data: mockMembers,
  isLoading: false,
  isError: false,
  isFetching: false,
  refetch: vi.fn(),
};

const mockMemberCount = {
  data: 68, // Total member count for pagination
};

vi.mock("@/features/members/hooks", () => ({
  useMembers: () => mockMembersQuery,
  useMemberCount: () => mockMemberCount,
  useMembersInfinite: () => mockMembersInfinite,
  useBulkUpdateMemberStatus: () => mockBulkUpdate,
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

describe("AdvancedMemberTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMembersInfinite.isLoading = false;
    mockMembersInfinite.isError = false;
    mockMembersInfinite.isFetching = false;
    mockBulkUpdate.isPending = false;
    mockDeleteMember.isPending = false;
  });

  it("renders table with member data", () => {
    render(<AdvancedMemberTable filters={{}} />, {
      wrapper: createQueryWrapper(),
    });

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    // Member numbers no longer displayed in table
  });

  it("shows loading state", () => {
    mockMembersQuery.isLoading = true;
    mockMembersQuery.data = undefined;

    render(<AdvancedMemberTable filters={{}} />, {
      wrapper: createQueryWrapper(),
    });

    expect(screen.getByText("Loading members...")).toBeInTheDocument();
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();

    // Reset
    mockMembersQuery.isLoading = false;
    mockMembersQuery.data = mockMembers;
  });

  it("shows error state with retry button", () => {
    mockMembersQuery.isError = true;

    render(<AdvancedMemberTable filters={{}} />, {
      wrapper: createQueryWrapper(),
    });

    expect(screen.getByText("Failed to load members")).toBeInTheDocument();
    expect(screen.getByText("Try Again")).toBeInTheDocument();

    // Reset
    mockMembersQuery.isError = false;
  });

  it("shows empty state when no members", () => {
    mockMembersQuery.data = [];

    render(<AdvancedMemberTable filters={{}} />, {
      wrapper: createQueryWrapper(),
    });

    expect(screen.getByText("No members found")).toBeInTheDocument();

    // Reset
    mockMembersQuery.data = mockMembers;
  });

  it("handles column sorting", () => {
    render(<AdvancedMemberTable filters={{}} />, {
      wrapper: createQueryWrapper(),
    });

    const nameColumn = screen.getByText("Member").closest("button");
    expect(nameColumn).toBeInTheDocument();

    fireEvent.click(nameColumn!);
    // Should toggle sort direction (tested via UI interaction)
  });

  it("shows bulk selection checkbox header", () => {
    render(<AdvancedMemberTable filters={{}} showActions />, {
      wrapper: createQueryWrapper(),
    });

    const selectAllCheckbox = screen.getByLabelText("Select all members");
    expect(selectAllCheckbox).toBeInTheDocument();
  });

  it("shows pagination controls", () => {
    render(<AdvancedMemberTable filters={{}} />, {
      wrapper: createQueryWrapper(),
    });

    // Check for pagination elements
    expect(screen.getByText(/Rows per page/i)).toBeInTheDocument();
    expect(screen.getByText(/Page 1 of/i)).toBeInTheDocument();

    // Use getAllByRole and filter to avoid "Last Payment" column conflict
    const buttons = screen.getAllByRole("button");
    const firstButton = buttons.find((btn) => btn.textContent === "First");
    const lastButton = buttons.find((btn) => btn.textContent === "Last");

    expect(firstButton).toBeInTheDocument();
    expect(lastButton).toBeInTheDocument();
  });

  it("shows background fetching indicator", () => {
    mockMembersQuery.isFetching = true;

    render(<AdvancedMemberTable filters={{}} />, {
      wrapper: createQueryWrapper(),
    });

    expect(screen.getByText("Refreshing data...")).toBeInTheDocument();

    // Reset
    mockMembersQuery.isFetching = false;
  });

  it("hides actions when showActions is false", () => {
    render(<AdvancedMemberTable filters={{}} showActions={false} />, {
      wrapper: createQueryWrapper(),
    });

    expect(
      screen.queryByLabelText("Select all members")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /open menu/i })
    ).not.toBeInTheDocument();
  });
});
