/**
 * @fileoverview Comprehensive integration tests for US-006: Member Details View Integration
 * Tests tab implementation and session data display for member detail pages
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { MemberDetailsWithTabs } from "../MemberDetailsWithTabs";
import type { Member } from "@/features/database/lib/types";
import { useMemberSessions } from "@/features/members/hooks/use-member-sessions";
import { useMemberSessionStats } from "@/features/members/hooks/use-member-session-stats";

// Mock the hooks
vi.mock("@/features/members/hooks/use-member-sessions", () => ({
  useMemberSessions: vi.fn(),
}));

vi.mock("@/features/members/hooks/use-member-session-stats", () => ({
  useMemberSessionStats: vi.fn(),
}));

// Mock the Supabase client
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
  },
}));

// Mock member data
const mockMember: Member = {
  id: "member-123",
  first_name: "John",
  last_name: "Doe",
  email: "john.doe@example.com",
  phone: "+1234567890",
  status: "active",
  join_date: "2024-01-15",
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-15T10:00:00Z",
  date_of_birth: "1990-05-15",
  gender: "male",
  address: {
    street: "123 Main St",
    city: "Anytown",
    state: "CA",
    postal_code: "12345",
    country: "USA",
  },
  profile_picture_url: null,
  notes: null,
  medical_considerations: null,
  fitness_goals: ["weight_loss", "muscle_gain"],
  preferred_contact_method: "email",
  marketing_consent: true,
  waiver_signed: true,
  waiver_signed_date: "2024-01-15",
  created_by: null,
  member_type: "full",
  trial_expires_at: null,
  preferred_trainers: null,
  session_history_summary: {
    total_sessions: 15,
    favorite_session_types: ["personal_training", "group_fitness"],
  },
};

// Mock session data
const mockSessions = [
  {
    id: "session-1",
    scheduled_start: "2024-01-20T10:00:00Z",
    scheduled_end: "2024-01-20T11:00:00Z",
    status: "completed",
    location: "Main Gym Floor",
    trainer_name: "Jane Smith",
    booking_status: "confirmed",
  },
  {
    id: "session-2",
    scheduled_start: "2024-01-25T14:00:00Z",
    scheduled_end: "2024-01-25T15:00:00Z",
    status: "scheduled",
    location: "Studio A",
    trainer_name: "Mike Johnson",
    booking_status: "confirmed",
  },
  {
    id: "session-3",
    scheduled_start: "2024-01-18T09:00:00Z",
    scheduled_end: "2024-01-18T10:00:00Z",
    status: "cancelled",
    location: "Main Gym Floor",
    trainer_name: "Jane Smith",
    booking_status: "cancelled",
  },
];

// Mock session stats
const mockSessionStats = {
  totalSessions: 15,
  completedSessions: 12,
  cancelledSessions: 2,
  upcomingSessions: 1,
  attendanceRate: 85.7,
  favoriteTrainers: [
    { trainer_name: "Jane Smith", session_count: 8 },
    { trainer_name: "Mike Johnson", session_count: 4 },
  ],
  preferredTimeSlots: [
    { time_slot: "10:00-11:00", session_count: 6 },
    { time_slot: "14:00-15:00", session_count: 5 },
  ],
  monthlyTrends: [
    { month: "2023-12", sessions: 4 },
    { month: "2024-01", sessions: 6 },
  ],
};

describe("US-006: Member Details View Integration", () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemberDetailsWithTabs member={mockMember} {...props} />
      </QueryClientProvider>
    );
  };

  describe("Tab Implementation", () => {
    it("should render tab interface with overview and sessions tabs", () => {
      vi.mocked(useMemberSessions).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });
      vi.mocked(useMemberSessionStats).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      useMemberSessions.mockReturnValue({
        data: mockSessions,
        isLoading: false,
        error: null,
      });

      useMemberSessionStats.mockReturnValue({
        data: mockSessionStats,
        isLoading: false,
        error: null,
      });

      renderComponent();

      // Check tab structure
      expect(screen.getByRole("tablist")).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /overview/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /sessions/i })
      ).toBeInTheDocument();
    });

    it("should show overview tab as active by default", () => {
      vi.mocked(useMemberSessions).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });
      vi.mocked(useMemberSessionStats).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      useMemberSessions.mockReturnValue({
        data: mockSessions,
        isLoading: false,
        error: null,
      });

      useMemberSessionStats.mockReturnValue({
        data: mockSessionStats,
        isLoading: false,
        error: null,
      });

      renderComponent();

      const overviewTab = screen.getByRole("tab", { name: /overview/i });
      expect(overviewTab).toHaveAttribute("aria-selected", "true");
      expect(overviewTab).toHaveAttribute("data-state", "active");
    });

    it("should switch to sessions tab when clicked", async () => {
      vi.mocked(useMemberSessions).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });
      vi.mocked(useMemberSessionStats).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      useMemberSessions.mockReturnValue({
        data: mockSessions,
        isLoading: false,
        error: null,
      });

      useMemberSessionStats.mockReturnValue({
        data: mockSessionStats,
        isLoading: false,
        error: null,
      });

      renderComponent();

      const sessionsTab = screen.getByRole("tab", { name: /sessions/i });
      await user.click(sessionsTab);

      await waitFor(() => {
        expect(sessionsTab).toHaveAttribute("aria-selected", "true");
        expect(sessionsTab).toHaveAttribute("data-state", "active");
      });
    });

    it("should maintain existing overview functionality", () => {
      vi.mocked(useMemberSessions).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });
      vi.mocked(useMemberSessionStats).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      useMemberSessions.mockReturnValue({
        data: mockSessions,
        isLoading: false,
        error: null,
      });

      useMemberSessionStats.mockReturnValue({
        data: mockSessionStats,
        isLoading: false,
        error: null,
      });

      renderComponent();

      // Check that existing member information is still displayed
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();
      expect(screen.getByText("+1234567890")).toBeInTheDocument();
    });
  });

  describe("Sessions Tab Content", () => {
    beforeEach(() => {
      vi.mocked(useMemberSessions).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });
      vi.mocked(useMemberSessionStats).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      useMemberSessions.mockReturnValue({
        data: mockSessions,
        isLoading: false,
        error: null,
      });

      useMemberSessionStats.mockReturnValue({
        data: mockSessionStats,
        isLoading: false,
        error: null,
      });
    });

    it("should display list of all sessions with details", async () => {
      renderComponent();

      const sessionsTab = screen.getByRole("tab", { name: /sessions/i });
      await user.click(sessionsTab);

      await waitFor(() => {
        // Check session details are displayed
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
        expect(screen.getByText("Mike Johnson")).toBeInTheDocument();
        expect(screen.getByText("Main Gym Floor")).toBeInTheDocument();
        expect(screen.getByText("Studio A")).toBeInTheDocument();
      });
    });

    it("should show session status badges correctly", async () => {
      renderComponent();

      const sessionsTab = screen.getByRole("tab", { name: /sessions/i });
      await user.click(sessionsTab);

      await waitFor(() => {
        expect(screen.getByText("completed")).toBeInTheDocument();
        expect(screen.getByText("scheduled")).toBeInTheDocument();
        expect(screen.getByText("cancelled")).toBeInTheDocument();
      });
    });

    it("should provide filter functionality by date range", async () => {
      renderComponent();

      const sessionsTab = screen.getByRole("tab", { name: /sessions/i });
      await user.click(sessionsTab);

      await waitFor(() => {
        expect(
          screen.getByRole("textbox", { name: /start date/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("textbox", { name: /end date/i })
        ).toBeInTheDocument();
      });
    });

    it("should provide filter functionality by trainer", async () => {
      renderComponent();

      const sessionsTab = screen.getByRole("tab", { name: /sessions/i });
      await user.click(sessionsTab);

      await waitFor(() => {
        const trainerFilter = screen.getByRole("combobox", {
          name: /trainer/i,
        });
        expect(trainerFilter).toBeInTheDocument();
      });
    });

    it("should provide filter functionality by status", async () => {
      renderComponent();

      const sessionsTab = screen.getByRole("tab", { name: /sessions/i });
      await user.click(sessionsTab);

      await waitFor(() => {
        const statusFilter = screen.getByRole("combobox", { name: /status/i });
        expect(statusFilter).toBeInTheDocument();
      });
    });

    it("should provide search functionality within sessions", async () => {
      renderComponent();

      const sessionsTab = screen.getByRole("tab", { name: /sessions/i });
      await user.click(sessionsTab);

      await waitFor(() => {
        const searchInput = screen.getByRole("textbox", {
          name: /search sessions/i,
        });
        expect(searchInput).toBeInTheDocument();
      });
    });

    it("should implement pagination for large session lists", async () => {
      // Mock large dataset
      const {
        useMemberSessions,
      } = require("@/features/members/hooks/use-member-sessions");
      const largeMockSessions = Array.from({ length: 25 }, (_, i) => ({
        id: `session-${i}`,
        scheduled_start: `2024-01-${String(i + 1).padStart(2, "0")}T10:00:00Z`,
        scheduled_end: `2024-01-${String(i + 1).padStart(2, "0")}T11:00:00Z`,
        status: "completed",
        location: `Location ${i}`,
        trainer_name: `Trainer ${i}`,
        booking_status: "confirmed",
      }));

      useMemberSessions.mockReturnValue({
        data: largeMockSessions,
        isLoading: false,
        error: null,
      });

      renderComponent();

      const sessionsTab = screen.getByRole("tab", { name: /sessions/i });
      await user.click(sessionsTab);

      await waitFor(() => {
        // Check pagination controls exist
        expect(
          screen.getByRole("button", { name: /next page/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /previous page/i })
        ).toBeInTheDocument();
      });
    });

    it("should provide quick actions for upcoming sessions", async () => {
      renderComponent();

      const sessionsTab = screen.getByRole("tab", { name: /sessions/i });
      await user.click(sessionsTab);

      await waitFor(() => {
        // Look for action buttons on scheduled sessions
        const actionButtons = screen.getAllByRole("button", {
          name: /cancel|reschedule/i,
        });
        expect(actionButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Analytics & Insights", () => {
    beforeEach(() => {
      vi.mocked(useMemberSessions).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });
      vi.mocked(useMemberSessionStats).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      useMemberSessions.mockReturnValue({
        data: mockSessions,
        isLoading: false,
        error: null,
      });

      useMemberSessionStats.mockReturnValue({
        data: mockSessionStats,
        isLoading: false,
        error: null,
      });
    });

    it("should display session count summary cards", async () => {
      renderComponent();

      const sessionsTab = screen.getByRole("tab", { name: /sessions/i });
      await user.click(sessionsTab);

      await waitFor(() => {
        expect(screen.getByText("Total Sessions")).toBeInTheDocument();
        expect(screen.getByText("15")).toBeInTheDocument();
        expect(screen.getByText("Completed Sessions")).toBeInTheDocument();
        expect(screen.getByText("12")).toBeInTheDocument();
      });
    });

    it("should calculate and display attendance rate", async () => {
      renderComponent();

      const sessionsTab = screen.getByRole("tab", { name: /sessions/i });
      await user.click(sessionsTab);

      await waitFor(() => {
        expect(screen.getByText("Attendance Rate")).toBeInTheDocument();
        expect(screen.getByText("85.7%")).toBeInTheDocument();
      });
    });

    it("should show favorite trainers and time slots", async () => {
      renderComponent();

      const sessionsTab = screen.getByRole("tab", { name: /sessions/i });
      await user.click(sessionsTab);

      await waitFor(() => {
        expect(screen.getByText("Favorite Trainers")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
        expect(screen.getByText("Preferred Time Slots")).toBeInTheDocument();
        expect(screen.getByText("10:00-11:00")).toBeInTheDocument();
      });
    });

    it("should display monthly activity trends", async () => {
      renderComponent();

      const sessionsTab = screen.getByRole("tab", { name: /sessions/i });
      await user.click(sessionsTab);

      await waitFor(() => {
        expect(screen.getByText("Monthly Trends")).toBeInTheDocument();
        // Check for chart or trend visualization
        expect(
          screen.getByRole("img", { name: /monthly activity chart/i })
        ).toBeInTheDocument();
      });
    });

    it("should provide basic session statistics", async () => {
      renderComponent();

      const sessionsTab = screen.getByRole("tab", { name: /sessions/i });
      await user.click(sessionsTab);

      await waitFor(() => {
        expect(screen.getByText("Cancelled Sessions")).toBeInTheDocument();
        expect(screen.getByText("2")).toBeInTheDocument();
        expect(screen.getByText("Upcoming Sessions")).toBeInTheDocument();
        expect(screen.getByText("1")).toBeInTheDocument();
      });
    });
  });

  describe("Responsive Design", () => {
    it("should adapt tab layout for mobile screens", () => {
      // Mock mobile viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });

      vi.mocked(useMemberSessions).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });
      vi.mocked(useMemberSessionStats).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      useMemberSessions.mockReturnValue({
        data: mockSessions,
        isLoading: false,
        error: null,
      });

      useMemberSessionStats.mockReturnValue({
        data: mockSessionStats,
        isLoading: false,
        error: null,
      });

      renderComponent();

      const tabList = screen.getByRole("tablist");
      expect(tabList).toHaveClass("flex-col", "sm:flex-row");
    });

    it("should stack cards vertically on tablet screens", () => {
      // Mock tablet viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 768,
      });

      vi.mocked(useMemberSessions).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });
      vi.mocked(useMemberSessionStats).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      useMemberSessions.mockReturnValue({
        data: mockSessions,
        isLoading: false,
        error: null,
      });

      useMemberSessionStats.mockReturnValue({
        data: mockSessionStats,
        isLoading: false,
        error: null,
      });

      renderComponent();

      const statsGrid = screen.getByTestId("session-stats-grid");
      expect(statsGrid).toHaveClass(
        "grid-cols-1",
        "md:grid-cols-2",
        "lg:grid-cols-4"
      );
    });
  });

  describe("Error Handling & Edge Cases", () => {
    it("should handle empty sessions list gracefully", async () => {
      vi.mocked(useMemberSessions).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });
      vi.mocked(useMemberSessionStats).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      useMemberSessions.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      useMemberSessionStats.mockReturnValue({
        data: { ...mockSessionStats, totalSessions: 0 },
        isLoading: false,
        error: null,
      });

      renderComponent();

      const sessionsTab = screen.getByRole("tab", { name: /sessions/i });
      await user.click(sessionsTab);

      await waitFor(() => {
        expect(screen.getByText(/no sessions found/i)).toBeInTheDocument();
      });
    });

    it("should show loading state while fetching sessions", () => {
      vi.mocked(useMemberSessions).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });
      vi.mocked(useMemberSessionStats).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      useMemberSessions.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      useMemberSessionStats.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      renderComponent();

      expect(screen.getByRole("progressbar")).toBeInTheDocument();
      expect(screen.getByText(/loading sessions/i)).toBeInTheDocument();
    });

    it("should handle session fetch errors", async () => {
      vi.mocked(useMemberSessions).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });
      vi.mocked(useMemberSessionStats).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      useMemberSessions.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Failed to fetch sessions"),
      });

      useMemberSessionStats.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Failed to fetch session stats"),
      });

      renderComponent();

      const sessionsTab = screen.getByRole("tab", { name: /sessions/i });
      await user.click(sessionsTab);

      await waitFor(() => {
        expect(
          screen.getByText(/failed to load sessions/i)
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /retry/i })
        ).toBeInTheDocument();
      });
    });

    it("should handle malformed session data", async () => {
      vi.mocked(useMemberSessions).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });
      vi.mocked(useMemberSessionStats).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      const malformedSessions = [
        {
          id: "session-1",
          // Missing required fields
          trainer_name: null,
          location: null,
        },
      ];

      useMemberSessions.mockReturnValue({
        data: malformedSessions,
        isLoading: false,
        error: null,
      });

      useMemberSessionStats.mockReturnValue({
        data: mockSessionStats,
        isLoading: false,
        error: null,
      });

      renderComponent();

      const sessionsTab = screen.getByRole("tab", { name: /sessions/i });
      await user.click(sessionsTab);

      await waitFor(() => {
        // Should show fallback values for missing data
        expect(screen.getByText("Unknown Trainer")).toBeInTheDocument();
        expect(screen.getByText("Not specified")).toBeInTheDocument();
      });
    });
  });

  describe("Performance & Integration", () => {
    it("should implement virtualization for large lists", async () => {
      // Mock very large dataset
      const {
        useMemberSessions,
      } = require("@/features/members/hooks/use-member-sessions");
      const veryLargeMockSessions = Array.from({ length: 1000 }, (_, i) => ({
        id: `session-${i}`,
        scheduled_start: `2024-01-01T10:00:00Z`,
        scheduled_end: `2024-01-01T11:00:00Z`,
        status: "completed",
        location: `Location ${i}`,
        trainer_name: `Trainer ${i}`,
        booking_status: "confirmed",
      }));

      useMemberSessions.mockReturnValue({
        data: veryLargeMockSessions,
        isLoading: false,
        error: null,
      });

      renderComponent();

      const sessionsTab = screen.getByRole("tab", { name: /sessions/i });
      await user.click(sessionsTab);

      await waitFor(() => {
        // Should only render visible items
        const renderedItems = screen.getAllByTestId(/session-item-/);
        expect(renderedItems.length).toBeLessThan(50); // Virtual scrolling should limit rendered items
      });
    });

    it("should integrate with existing member hooks correctly", () => {
      vi.mocked(useMemberSessions).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });
      vi.mocked(useMemberSessionStats).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      useMemberSessions.mockReturnValue({
        data: mockSessions,
        isLoading: false,
        error: null,
      });

      useMemberSessionStats.mockReturnValue({
        data: mockSessionStats,
        isLoading: false,
        error: null,
      });

      renderComponent();

      // Verify hooks were called with correct parameters
      expect(useMemberSessions).toHaveBeenCalledWith(
        "member-123",
        expect.any(Object)
      );
      expect(useMemberSessionStats).toHaveBeenCalledWith("member-123");
    });

    it("should support keyboard navigation", async () => {
      vi.mocked(useMemberSessions).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });
      vi.mocked(useMemberSessionStats).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      useMemberSessions.mockReturnValue({
        data: mockSessions,
        isLoading: false,
        error: null,
      });

      useMemberSessionStats.mockReturnValue({
        data: mockSessionStats,
        isLoading: false,
        error: null,
      });

      renderComponent();

      const overviewTab = screen.getByRole("tab", { name: /overview/i });
      const sessionsTab = screen.getByRole("tab", { name: /sessions/i });

      // Focus first tab
      overviewTab.focus();
      expect(overviewTab).toHaveFocus();

      // Arrow key navigation
      fireEvent.keyDown(overviewTab, { key: "ArrowRight" });
      expect(sessionsTab).toHaveFocus();

      // Enter key activation
      fireEvent.keyDown(sessionsTab, { key: "Enter" });
      await waitFor(() => {
        expect(sessionsTab).toHaveAttribute("aria-selected", "true");
      });
    });
  });
});
