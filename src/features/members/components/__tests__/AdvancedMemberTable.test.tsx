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
    fitness_goals: null,
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

vi.mock("@/features/members/hooks", () => ({
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
    expect(screen.getByText("MEM001")).toBeInTheDocument();
    expect(screen.getByText("MEM002")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    mockMembersInfinite.isLoading = true;

    render(<AdvancedMemberTable filters={{}} />, {
      wrapper: createQueryWrapper(),
    });

    expect(screen.getByText("Loading members...")).toBeInTheDocument();
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("shows error state with retry button", () => {
    mockMembersInfinite.isError = true;

    render(<AdvancedMemberTable filters={{}} />, {
      wrapper: createQueryWrapper(),
    });

    expect(screen.getByText("Failed to load members")).toBeInTheDocument();
    expect(screen.getByText("Try Again")).toBeInTheDocument();
  });

  it("shows empty state when no members", () => {
    mockMembersInfinite.data = { pages: [[]] };

    render(<AdvancedMemberTable filters={{}} />, {
      wrapper: createQueryWrapper(),
    });

    expect(screen.getByText("No members found")).toBeInTheDocument();
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

  it("shows load more button when hasNextPage", () => {
    render(<AdvancedMemberTable filters={{}} />, {
      wrapper: createQueryWrapper(),
    });

    expect(screen.getByText("Load More Members")).toBeInTheDocument();
  });

  it("shows background fetching indicator", () => {
    mockMembersInfinite.isFetching = true;

    render(<AdvancedMemberTable filters={{}} />, {
      wrapper: createQueryWrapper(),
    });

    expect(screen.getByText("Refreshing data...")).toBeInTheDocument();
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
