import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemberCommentsCard } from "../MemberCommentsCard";
import { createQueryWrapper } from "@/test/query-test-utils";
import type {
  MemberComment,
  MemberWithSubscription,
} from "@/features/database/lib/types";

// Mock the hooks
const mockUseMemberComments = {
  data: [] as MemberComment[],
  isLoading: false,
  isError: false,
  error: null,
};

const mockDeleteComment = {
  mutateAsync: vi.fn(),
  isPending: false,
};

const mockCreateComment = {
  mutateAsync: vi.fn(),
  isPending: false,
};

const mockUpdateComment = {
  mutateAsync: vi.fn(),
  isPending: false,
};

vi.mock("@/features/members/hooks", () => ({
  useMemberComments: () => mockUseMemberComments,
  useDeleteComment: () => mockDeleteComment,
  useCreateComment: () => mockCreateComment,
  useUpdateComment: () => mockUpdateComment,
  useActiveCommentAlerts: () => ({ data: [], isLoading: false }),
}));

// Mock window.confirm
const mockConfirm = vi.fn();
global.confirm = mockConfirm;

const mockMember: MemberWithSubscription = {
  id: "member-1",
  first_name: "John",
  last_name: "Doe",
  email: "john.doe@example.com",
  phone: "+1234567890",
  date_of_birth: "1990-01-01",
  gender: "male",
  address: {
    street: "123 Main St",
    city: "Anytown",
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
  profile_picture_url: null,
  created_at: "2024-01-15T00:00:00Z",
  updated_at: "2024-01-15T00:00:00Z",
  member_type: "full",
  uniform_size: "M",
  uniform_received: false,
  vest_size: "V1",
  hip_belt_size: "V1",
  referral_source: "instagram",
  referred_by_member_id: null,
  training_preference: undefined,
  subscription: null,
};

const mockComment: MemberComment = {
  id: "comment-1",
  member_id: "member-1",
  author: "Test Author",
  body: "This is a test comment that is long enough to meet the minimum requirements",
  due_date: "2025-12-31",
  created_by: "user-1",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

describe("MemberCommentsCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockReturnValue(false); // Default to cancel
    mockUseMemberComments.data = [];
    mockUseMemberComments.isLoading = false;
    mockUseMemberComments.isError = false;
  });

  describe("AC-006: Rendering states", () => {
    it("renders loading state", () => {
      mockUseMemberComments.isLoading = true;

      render(<MemberCommentsCard member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      expect(screen.getByText("Loading comments...")).toBeInTheDocument();
    });

    it("renders empty state when no comments", () => {
      mockUseMemberComments.data = [];

      render(<MemberCommentsCard member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      expect(screen.getByText("No comments yet")).toBeInTheDocument();
      expect(
        screen.getByText("Add a comment to track notes or set reminders")
      ).toBeInTheDocument();
    });

    it("renders list of comments", () => {
      mockUseMemberComments.data = [
        mockComment,
        {
          ...mockComment,
          id: "comment-2",
          author: "Another Author",
          body: "Another comment with sufficient length for validation requirements",
          due_date: null,
        },
      ];

      render(<MemberCommentsCard member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      expect(screen.getByText("Test Author")).toBeInTheDocument();
      expect(screen.getByText("Another Author")).toBeInTheDocument();
      expect(
        screen.getByText(
          "This is a test comment that is long enough to meet the minimum requirements"
        )
      ).toBeInTheDocument();
    });

    it("renders due date badge when comment has due date", () => {
      mockUseMemberComments.data = [mockComment];

      render(<MemberCommentsCard member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      expect(screen.getByText(/Due:/)).toBeInTheDocument();
    });

    it("shows destructive badge for due soon comments", () => {
      const dueSoonComment = {
        ...mockComment,
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0], // 2 days from now
      };
      mockUseMemberComments.data = [dueSoonComment];

      const { container } = render(<MemberCommentsCard member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      // Check for destructive variant badge (has specific styling)
      const badge = container.querySelector('[class*="destructive"]');
      expect(badge).toBeInTheDocument();
    });
  });

  describe("AC-006: User interactions", () => {
    it("opens add dialog when Add Comment button clicked", async () => {
      render(<MemberCommentsCard member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      const addButton = screen.getByRole("button", { name: /add comment/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        // Dialog should be rendered (check for dialog heading)
        expect(
          screen.getByRole("heading", { name: "Add Comment" })
        ).toBeInTheDocument();
      });
    });

    it("opens edit dialog when edit button clicked", async () => {
      mockUseMemberComments.data = [mockComment];

      render(<MemberCommentsCard member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      const editButtons = screen.getAllByRole("button", {
        name: /edit comment/i,
      });
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        // Dialog should be rendered in edit mode
        expect(
          screen.getByRole("heading", { name: "Edit Comment" })
        ).toBeInTheDocument();
      });
    });

    it("confirms before deleting comment", async () => {
      mockUseMemberComments.data = [mockComment];
      mockConfirm.mockReturnValue(false); // User cancels

      render(<MemberCommentsCard member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockConfirm).toHaveBeenCalledWith(
          "Are you sure you want to delete this comment?"
        );
        // Mutation should not be called when user cancels
        expect(mockDeleteComment.mutateAsync).not.toHaveBeenCalled();
      });
    });

    it("deletes comment when user confirms", async () => {
      mockUseMemberComments.data = [mockComment];
      mockConfirm.mockReturnValue(true); // User confirms
      mockDeleteComment.mutateAsync.mockResolvedValue(undefined);

      render(<MemberCommentsCard member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockConfirm).toHaveBeenCalled();
        expect(mockDeleteComment.mutateAsync).toHaveBeenCalledWith({
          id: "comment-1",
          memberId: "member-1",
        });
      });
    });
  });

  describe("AC-006: Accessibility", () => {
    it("has accessible button labels", () => {
      mockUseMemberComments.data = [mockComment];

      render(<MemberCommentsCard member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      expect(
        screen.getByRole("button", { name: /edit comment/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /delete comment/i })
      ).toBeInTheDocument();
    });

    it("renders card with proper heading", () => {
      render(<MemberCommentsCard member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      // Card title should be present
      expect(screen.getByText("Comments & Notes")).toBeInTheDocument();
    });
  });

  describe("Date formatting", () => {
    it("formats dates correctly", () => {
      mockUseMemberComments.data = [mockComment];

      render(<MemberCommentsCard member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      // Check for formatted date in the created_at timestamp
      expect(screen.getByText(/Jan 1, 2025/)).toBeInTheDocument();
    });
  });
});
