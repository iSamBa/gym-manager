/**
 * @fileoverview Comprehensive integration tests for US-007: Trainer Details View Integration
 * Tests tab implementation, session management, analytics, and availability management for trainer detail pages
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { TrainerDetailsWithTabs } from "../TrainerDetailsWithTabs";
import type { TrainerWithProfile } from "@/features/database/lib/types";

// Mock the hooks
vi.mock("@/features/trainers/hooks/use-trainer-sessions", () => ({
  useTrainerSessions: vi.fn(),
}));

vi.mock("@/features/trainers/hooks/use-trainer-analytics", () => ({
  useTrainerAnalytics: vi.fn(),
}));

vi.mock("@/features/trainers/hooks/use-trainer-availability", () => ({
  useTrainerAvailability: vi.fn(),
  useUpdateTrainerAvailability: vi.fn(),
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

// Mock trainer data
const mockTrainer: TrainerWithProfile = {
  id: "trainer-123",
  hourly_rate: 75.0,
  commission_rate: 15,
  max_clients_per_session: 3,
  years_experience: 5,
  certifications: ["NASM-CPT", "Yoga Alliance RYT-200"],
  specializations: ["Personal Training", "Yoga", "Strength Training"],
  languages: ["English", "Spanish"],
  availability: {
    monday: { start: "06:00", end: "20:00", breaks: [] },
    tuesday: { start: "06:00", end: "20:00", breaks: [] },
    wednesday: { start: "06:00", end: "20:00", breaks: [] },
    thursday: { start: "06:00", end: "20:00", breaks: [] },
    friday: { start: "06:00", end: "20:00", breaks: [] },
    saturday: { start: "08:00", end: "18:00", breaks: [] },
    sunday: { start: "08:00", end: "16:00", breaks: [] },
  },
  is_accepting_new_clients: true,
  emergency_contact: {
    name: "Jane Smith",
    phone: "+1987654321",
    relationship: "spouse",
  },
  insurance_policy_number: "INS-123456",
  background_check_date: "2023-01-15",
  cpr_certification_expires: "2025-06-30",
  notes: "Excellent trainer with focus on functional fitness",
  created_at: "2023-01-15T10:00:00Z",
  updated_at: "2024-01-15T10:00:00Z",
  date_of_birth: "1988-03-20",
  user_profile: {
    id: "trainer-123",
    role: "trainer",
    email: "trainer@example.com",
    first_name: "Mike",
    last_name: "Johnson",
    phone: "+1234567890",
    avatar_url: null,
    bio: "Passionate fitness trainer with 5 years of experience",
    hire_date: "2023-01-15",
    is_active: true,
    created_at: "2023-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    date_of_birth: "1988-03-20",
  },
};

// Mock trainer sessions
const mockTrainerSessions = [
  {
    id: "session-1",
    scheduled_start: "2024-01-20T10:00:00Z",
    scheduled_end: "2024-01-20T11:00:00Z",
    status: "completed",
    location: "Main Gym Floor",
    max_participants: 3,
    current_participants: 2,
    participants: [
      { id: "member-1", name: "John Doe", email: "john@example.com" },
      { id: "member-2", name: "Jane Smith", email: "jane@example.com" },
    ],
    attendance_rate: 100,
  },
  {
    id: "session-2",
    scheduled_start: "2024-01-25T14:00:00Z",
    scheduled_end: "2024-01-25T15:00:00Z",
    status: "scheduled",
    location: "Studio A",
    max_participants: 3,
    current_participants: 1,
    participants: [
      { id: "member-3", name: "Bob Wilson", email: "bob@example.com" },
    ],
    attendance_rate: null,
  },
  {
    id: "session-3",
    scheduled_start: "2024-01-18T09:00:00Z",
    scheduled_end: "2024-01-18T10:00:00Z",
    status: "cancelled",
    location: "Main Gym Floor",
    max_participants: 3,
    current_participants: 0,
    participants: [],
    attendance_rate: null,
  },
];

// Mock trainer analytics
const mockTrainerAnalytics = {
  totalSessions: 45,
  completedSessions: 38,
  cancelledSessions: 4,
  upcomingSessions: 3,
  sessionCompletionRate: 84.4,
  averageAttendancePerSession: 2.1,
  utilizationRate: 70.0,
  peakHours: [
    { time_slot: "10:00-11:00", session_count: 12 },
    { time_slot: "14:00-15:00", session_count: 10 },
    { time_slot: "18:00-19:00", session_count: 8 },
  ],
  clientRetentionMetrics: {
    newClients: 8,
    returningClients: 15,
    retentionRate: 65.2,
  },
  monthlyTrends: [
    { month: "2023-12", sessions: 18, revenue: 1350 },
    { month: "2024-01", sessions: 22, revenue: 1650 },
  ],
  topClients: [
    { client_name: "John Doe", session_count: 12 },
    { client_name: "Jane Smith", session_count: 8 },
  ],
  revenueGenerated: 3375.0,
  averageSessionRating: 4.7,
};

// Mock availability data
const mockAvailabilityData = {
  currentAvailability: {
    monday: {
      start: "06:00",
      end: "20:00",
      breaks: [{ start: "12:00", end: "13:00" }],
    },
    tuesday: { start: "06:00", end: "20:00", breaks: [] },
    wednesday: { start: "06:00", end: "20:00", breaks: [] },
    thursday: { start: "06:00", end: "20:00", breaks: [] },
    friday: { start: "06:00", end: "20:00", breaks: [] },
    saturday: { start: "08:00", end: "18:00", breaks: [] },
    sunday: null, // Not available on Sundays
  },
  blockedSlots: [
    {
      date: "2024-01-30",
      start: "10:00",
      end: "12:00",
      reason: "Personal appointment",
    },
    {
      date: "2024-02-05",
      start: "14:00",
      end: "16:00",
      reason: "Training workshop",
    },
  ],
  vacationPeriods: [
    {
      start_date: "2024-03-15",
      end_date: "2024-03-22",
      reason: "Spring vacation",
    },
  ],
};

describe("US-007: Trainer Details View Integration", () => {
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
        <TrainerDetailsWithTabs trainer={mockTrainer} {...props} />
      </QueryClientProvider>
    );
  };

  describe("Tab Implementation", () => {
    beforeEach(() => {
      const {
        useTrainerSessions,
      } = require("@/features/trainers/hooks/use-trainer-sessions");
      const {
        useTrainerAnalytics,
      } = require("@/features/trainers/hooks/use-trainer-analytics");
      const {
        useTrainerAvailability,
      } = require("@/features/trainers/hooks/use-trainer-availability");

      useTrainerSessions.mockReturnValue({
        data: mockTrainerSessions,
        isLoading: false,
        error: null,
      });

      useTrainerAnalytics.mockReturnValue({
        data: mockTrainerAnalytics,
        isLoading: false,
        error: null,
      });

      useTrainerAvailability.mockReturnValue({
        data: mockAvailabilityData,
        isLoading: false,
        error: null,
      });
    });

    it("should render tab interface with overview, sessions, analytics, and availability tabs", () => {
      renderComponent();

      expect(screen.getByRole("tablist")).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /overview/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /sessions/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /analytics/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /availability/i })
      ).toBeInTheDocument();
    });

    it("should show overview tab as active by default", () => {
      renderComponent();

      const overviewTab = screen.getByRole("tab", { name: /overview/i });
      expect(overviewTab).toHaveAttribute("aria-selected", "true");
      expect(overviewTab).toHaveAttribute("data-state", "active");
    });

    it("should switch between tabs correctly", async () => {
      renderComponent();

      const sessionsTab = screen.getByRole("tab", { name: /sessions/i });
      await user.click(sessionsTab);

      await waitFor(() => {
        expect(sessionsTab).toHaveAttribute("aria-selected", "true");
      });

      const analyticsTab = screen.getByRole("tab", { name: /analytics/i });
      await user.click(analyticsTab);

      await waitFor(() => {
        expect(analyticsTab).toHaveAttribute("aria-selected", "true");
      });

      const availabilityTab = screen.getByRole("tab", {
        name: /availability/i,
      });
      await user.click(availabilityTab);

      await waitFor(() => {
        expect(availabilityTab).toHaveAttribute("aria-selected", "true");
      });
    });
  });

  describe("Sessions Management", () => {
    beforeEach(() => {
      const {
        useTrainerSessions,
      } = require("@/features/trainers/hooks/use-trainer-sessions");
      const {
        useTrainerAnalytics,
      } = require("@/features/trainers/hooks/use-trainer-analytics");
      const {
        useTrainerAvailability,
      } = require("@/features/trainers/hooks/use-trainer-availability");

      useTrainerSessions.mockReturnValue({
        data: mockTrainerSessions,
        isLoading: false,
        error: null,
      });

      useTrainerAnalytics.mockReturnValue({
        data: mockTrainerAnalytics,
        isLoading: false,
        error: null,
      });

      useTrainerAvailability.mockReturnValue({
        data: mockAvailabilityData,
        isLoading: false,
        error: null,
      });
    });

    it("should display calendar view of trainer schedule", async () => {
      renderComponent();

      const sessionsTab = screen.getByRole("tab", { name: /sessions/i });
      await user.click(sessionsTab);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /calendar view/i })
        ).toBeInTheDocument();
        expect(
          screen.getByTestId("trainer-sessions-calendar")
        ).toBeInTheDocument();
      });
    });

    it("should display list view with filtering and search", async () => {
      renderComponent();

      const sessionsTab = screen.getByRole("tab", { name: /sessions/i });
      await user.click(sessionsTab);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /list view/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("textbox", { name: /search sessions/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("combobox", { name: /status filter/i })
        ).toBeInTheDocument();
      });
    });

    it("should show session capacity utilization tracking", async () => {
      renderComponent();

      const sessionsTab = screen.getByRole("tab", { name: /sessions/i });
      await user.click(sessionsTab);

      await waitFor(() => {
        // Check capacity indicators
        expect(screen.getByText("2/3 participants")).toBeInTheDocument();
        expect(screen.getByText("1/3 participants")).toBeInTheDocument();

        // Check utilization visualization
        expect(
          screen.getByTestId("capacity-utilization-bar")
        ).toBeInTheDocument();
      });
    });

    it("should display client attendance analytics per session", async () => {
      renderComponent();

      const sessionsTab = screen.getByRole("tab", { name: /sessions/i });
      await user.click(sessionsTab);

      await waitFor(() => {
        expect(screen.getByText("100% attendance")).toBeInTheDocument();
        expect(
          screen.getByTestId("session-attendance-metrics")
        ).toBeInTheDocument();
      });
    });

    it("should provide basic session tracking and management", async () => {
      renderComponent();

      const sessionsTab = screen.getByRole("tab", { name: /sessions/i });
      await user.click(sessionsTab);

      await waitFor(() => {
        // Session status indicators
        expect(screen.getByText("completed")).toBeInTheDocument();
        expect(screen.getByText("scheduled")).toBeInTheDocument();
        expect(screen.getByText("cancelled")).toBeInTheDocument();

        // Management actions
        expect(
          screen.getByRole("button", { name: /add new session/i })
        ).toBeInTheDocument();
        expect(
          screen.getAllByRole("button", { name: /edit session/i }).length
        ).toBeGreaterThan(0);
      });
    });

    it("should switch between calendar and list views", async () => {
      renderComponent();

      const sessionsTab = screen.getByRole("tab", { name: /sessions/i });
      await user.click(sessionsTab);

      await waitFor(() => {
        const listViewButton = screen.getByRole("button", {
          name: /list view/i,
        });
        const calendarViewButton = screen.getByRole("button", {
          name: /calendar view/i,
        });

        expect(listViewButton).toBeInTheDocument();
        expect(calendarViewButton).toBeInTheDocument();
      });

      const listViewButton = screen.getByRole("button", { name: /list view/i });
      await user.click(listViewButton);

      await waitFor(() => {
        expect(screen.getByTestId("sessions-list-view")).toBeInTheDocument();
      });
    });
  });

  describe("Performance Analytics", () => {
    beforeEach(() => {
      const {
        useTrainerSessions,
      } = require("@/features/trainers/hooks/use-trainer-sessions");
      const {
        useTrainerAnalytics,
      } = require("@/features/trainers/hooks/use-trainer-analytics");
      const {
        useTrainerAvailability,
      } = require("@/features/trainers/hooks/use-trainer-availability");

      useTrainerSessions.mockReturnValue({
        data: mockTrainerSessions,
        isLoading: false,
        error: null,
      });

      useTrainerAnalytics.mockReturnValue({
        data: mockTrainerAnalytics,
        isLoading: false,
        error: null,
      });

      useTrainerAvailability.mockReturnValue({
        data: mockAvailabilityData,
        isLoading: false,
        error: null,
      });
    });

    it("should display session completion rates", async () => {
      renderComponent();

      const analyticsTab = screen.getByRole("tab", { name: /analytics/i });
      await user.click(analyticsTab);

      await waitFor(() => {
        expect(screen.getByText("Session Completion Rate")).toBeInTheDocument();
        expect(screen.getByText("84.4%")).toBeInTheDocument();
      });
    });

    it("should show average attendance per session", async () => {
      renderComponent();

      const analyticsTab = screen.getByRole("tab", { name: /analytics/i });
      await user.click(analyticsTab);

      await waitFor(() => {
        expect(screen.getByText("Average Attendance")).toBeInTheDocument();
        expect(screen.getByText("2.1 clients/session")).toBeInTheDocument();
      });
    });

    it("should display peak hours and popular time slots", async () => {
      renderComponent();

      const analyticsTab = screen.getByRole("tab", { name: /analytics/i });
      await user.click(analyticsTab);

      await waitFor(() => {
        expect(screen.getByText("Peak Hours")).toBeInTheDocument();
        expect(screen.getByText("10:00-11:00")).toBeInTheDocument();
        expect(screen.getByText("12 sessions")).toBeInTheDocument();
      });
    });

    it("should show client retention metrics", async () => {
      renderComponent();

      const analyticsTab = screen.getByRole("tab", { name: /analytics/i });
      await user.click(analyticsTab);

      await waitFor(() => {
        expect(screen.getByText("Client Retention")).toBeInTheDocument();
        expect(screen.getByText("65.2%")).toBeInTheDocument();
        expect(screen.getByText("New Clients: 8")).toBeInTheDocument();
        expect(screen.getByText("Returning Clients: 15")).toBeInTheDocument();
      });
    });

    it("should display utilization rate calculations", async () => {
      renderComponent();

      const analyticsTab = screen.getByRole("tab", { name: /analytics/i });
      await user.click(analyticsTab);

      await waitFor(() => {
        expect(screen.getByText("Utilization Rate")).toBeInTheDocument();
        expect(screen.getByText("70.0%")).toBeInTheDocument();
      });
    });

    it("should show monthly activity trends", async () => {
      renderComponent();

      const analyticsTab = screen.getByRole("tab", { name: /analytics/i });
      await user.click(analyticsTab);

      await waitFor(() => {
        expect(screen.getByText("Monthly Trends")).toBeInTheDocument();
        expect(
          screen.getByRole("img", { name: /monthly trends chart/i })
        ).toBeInTheDocument();
      });
    });

    it("should display revenue analytics", async () => {
      renderComponent();

      const analyticsTab = screen.getByRole("tab", { name: /analytics/i });
      await user.click(analyticsTab);

      await waitFor(() => {
        expect(screen.getByText("Revenue Generated")).toBeInTheDocument();
        expect(screen.getByText("$3,375.00")).toBeInTheDocument();
      });
    });

    it("should show session rating metrics", async () => {
      renderComponent();

      const analyticsTab = screen.getByRole("tab", { name: /analytics/i });
      await user.click(analyticsTab);

      await waitFor(() => {
        expect(screen.getByText("Average Rating")).toBeInTheDocument();
        expect(screen.getByText("4.7/5.0")).toBeInTheDocument();
      });
    });
  });

  describe("Availability Management", () => {
    beforeEach(() => {
      const {
        useTrainerSessions,
      } = require("@/features/trainers/hooks/use-trainer-sessions");
      const {
        useTrainerAnalytics,
      } = require("@/features/trainers/hooks/use-trainer-analytics");
      const {
        useTrainerAvailability,
        useUpdateTrainerAvailability,
      } = require("@/features/trainers/hooks/use-trainer-availability");

      useTrainerSessions.mockReturnValue({
        data: mockTrainerSessions,
        isLoading: false,
        error: null,
      });

      useTrainerAnalytics.mockReturnValue({
        data: mockTrainerAnalytics,
        isLoading: false,
        error: null,
      });

      useTrainerAvailability.mockReturnValue({
        data: mockAvailabilityData,
        isLoading: false,
        error: null,
      });

      useUpdateTrainerAvailability.mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      });
    });

    it("should view current availability windows", async () => {
      renderComponent();

      const availabilityTab = screen.getByRole("tab", {
        name: /availability/i,
      });
      await user.click(availabilityTab);

      await waitFor(() => {
        expect(screen.getByText("Monday: 06:00 - 20:00")).toBeInTheDocument();
        expect(screen.getByText("Tuesday: 06:00 - 20:00")).toBeInTheDocument();
        expect(screen.getByText("Sunday: Not Available")).toBeInTheDocument();
      });
    });

    it("should allow blocking/unblocking time slots", async () => {
      renderComponent();

      const availabilityTab = screen.getByRole("tab", {
        name: /availability/i,
      });
      await user.click(availabilityTab);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /block time slot/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /unblock time slot/i })
        ).toBeInTheDocument();
      });

      const blockButton = screen.getByRole("button", {
        name: /block time slot/i,
      });
      await user.click(blockButton);

      await waitFor(() => {
        expect(
          screen.getByRole("dialog", { name: /block time slot/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("textbox", { name: /reason/i })
        ).toBeInTheDocument();
      });
    });

    it("should set recurring availability patterns", async () => {
      renderComponent();

      const availabilityTab = screen.getByRole("tab", {
        name: /availability/i,
      });
      await user.click(availabilityTab);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /set recurring pattern/i })
        ).toBeInTheDocument();
      });

      const recurringButton = screen.getByRole("button", {
        name: /set recurring pattern/i,
      });
      await user.click(recurringButton);

      await waitFor(() => {
        expect(
          screen.getByRole("dialog", { name: /recurring availability/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("checkbox", { name: /monday/i })
        ).toBeInTheDocument();
      });
    });

    it("should override availability for specific dates", async () => {
      renderComponent();

      const availabilityTab = screen.getByRole("tab", {
        name: /availability/i,
      });
      await user.click(availabilityTab);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /date override/i })
        ).toBeInTheDocument();
      });

      const overrideButton = screen.getByRole("button", {
        name: /date override/i,
      });
      await user.click(overrideButton);

      await waitFor(() => {
        expect(
          screen.getByRole("textbox", { name: /date/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("textbox", { name: /start time/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("textbox", { name: /end time/i })
        ).toBeInTheDocument();
      });
    });

    it("should manage vacation and break periods", async () => {
      renderComponent();

      const availabilityTab = screen.getByRole("tab", {
        name: /availability/i,
      });
      await user.click(availabilityTab);

      await waitFor(() => {
        expect(screen.getByText("Vacation Periods")).toBeInTheDocument();
        expect(screen.getByText("Spring vacation")).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /add vacation/i })
        ).toBeInTheDocument();
      });

      const addVacationButton = screen.getByRole("button", {
        name: /add vacation/i,
      });
      await user.click(addVacationButton);

      await waitFor(() => {
        expect(
          screen.getByRole("dialog", { name: /add vacation period/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("textbox", { name: /start date/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("textbox", { name: /end date/i })
        ).toBeInTheDocument();
      });
    });

    it("should show blocked time slots", async () => {
      renderComponent();

      const availabilityTab = screen.getByRole("tab", {
        name: /availability/i,
      });
      await user.click(availabilityTab);

      await waitFor(() => {
        expect(screen.getByText("Blocked Time Slots")).toBeInTheDocument();
        expect(screen.getByText("Personal appointment")).toBeInTheDocument();
        expect(screen.getByText("Training workshop")).toBeInTheDocument();
      });
    });
  });

  describe("Responsive Design", () => {
    beforeEach(() => {
      const {
        useTrainerSessions,
      } = require("@/features/trainers/hooks/use-trainer-sessions");
      const {
        useTrainerAnalytics,
      } = require("@/features/trainers/hooks/use-trainer-analytics");
      const {
        useTrainerAvailability,
      } = require("@/features/trainers/hooks/use-trainer-availability");

      useTrainerSessions.mockReturnValue({
        data: mockTrainerSessions,
        isLoading: false,
        error: null,
      });

      useTrainerAnalytics.mockReturnValue({
        data: mockTrainerAnalytics,
        isLoading: false,
        error: null,
      });

      useTrainerAvailability.mockReturnValue({
        data: mockAvailabilityData,
        isLoading: false,
        error: null,
      });
    });

    it("should adapt for mobile screens", () => {
      // Mock mobile viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderComponent();

      const tabList = screen.getByRole("tablist");
      expect(tabList).toHaveClass("flex-col", "sm:flex-row");
    });

    it("should stack analytics cards on smaller screens", async () => {
      // Mock tablet viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 768,
      });

      renderComponent();

      const analyticsTab = screen.getByRole("tab", { name: /analytics/i });
      await user.click(analyticsTab);

      await waitFor(() => {
        const analyticsGrid = screen.getByTestId("analytics-grid");
        expect(analyticsGrid).toHaveClass(
          "grid-cols-1",
          "md:grid-cols-2",
          "lg:grid-cols-3"
        );
      });
    });

    it("should adapt availability calendar for mobile", async () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderComponent();

      const availabilityTab = screen.getByRole("tab", {
        name: /availability/i,
      });
      await user.click(availabilityTab);

      await waitFor(() => {
        const availabilityCalendar = screen.getByTestId(
          "availability-calendar"
        );
        expect(availabilityCalendar).toHaveClass("mobile-layout");
      });
    });
  });

  describe("Error Handling & Edge Cases", () => {
    it("should handle empty sessions list", async () => {
      const {
        useTrainerSessions,
      } = require("@/features/trainers/hooks/use-trainer-sessions");
      const {
        useTrainerAnalytics,
      } = require("@/features/trainers/hooks/use-trainer-analytics");
      const {
        useTrainerAvailability,
      } = require("@/features/trainers/hooks/use-trainer-availability");

      useTrainerSessions.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      useTrainerAnalytics.mockReturnValue({
        data: { ...mockTrainerAnalytics, totalSessions: 0 },
        isLoading: false,
        error: null,
      });

      useTrainerAvailability.mockReturnValue({
        data: mockAvailabilityData,
        isLoading: false,
        error: null,
      });

      renderComponent();

      const sessionsTab = screen.getByRole("tab", { name: /sessions/i });
      await user.click(sessionsTab);

      await waitFor(() => {
        expect(screen.getByText(/no sessions scheduled/i)).toBeInTheDocument();
      });
    });

    it("should show loading states", () => {
      const {
        useTrainerSessions,
      } = require("@/features/trainers/hooks/use-trainer-sessions");
      const {
        useTrainerAnalytics,
      } = require("@/features/trainers/hooks/use-trainer-analytics");
      const {
        useTrainerAvailability,
      } = require("@/features/trainers/hooks/use-trainer-availability");

      useTrainerSessions.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      useTrainerAnalytics.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      useTrainerAvailability.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      renderComponent();

      expect(screen.getByRole("progressbar")).toBeInTheDocument();
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it("should handle API errors gracefully", async () => {
      const {
        useTrainerSessions,
      } = require("@/features/trainers/hooks/use-trainer-sessions");
      const {
        useTrainerAnalytics,
      } = require("@/features/trainers/hooks/use-trainer-analytics");
      const {
        useTrainerAvailability,
      } = require("@/features/trainers/hooks/use-trainer-availability");

      useTrainerSessions.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Failed to fetch sessions"),
      });

      useTrainerAnalytics.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Failed to fetch analytics"),
      });

      useTrainerAvailability.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Failed to fetch availability"),
      });

      renderComponent();

      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /retry/i })
      ).toBeInTheDocument();
    });

    it("should handle missing trainer profile data", () => {
      const trainerWithoutProfile = {
        ...mockTrainer,
        user_profile: null,
      };

      renderComponent({ trainer: trainerWithoutProfile });

      expect(screen.getByText("Unknown Trainer")).toBeInTheDocument();
    });

    it("should validate availability time inputs", async () => {
      const {
        useTrainerSessions,
      } = require("@/features/trainers/hooks/use-trainer-sessions");
      const {
        useTrainerAnalytics,
      } = require("@/features/trainers/hooks/use-trainer-analytics");
      const {
        useTrainerAvailability,
        useUpdateTrainerAvailability,
      } = require("@/features/trainers/hooks/use-trainer-availability");

      useTrainerSessions.mockReturnValue({
        data: mockTrainerSessions,
        isLoading: false,
        error: null,
      });

      useTrainerAnalytics.mockReturnValue({
        data: mockTrainerAnalytics,
        isLoading: false,
        error: null,
      });

      useTrainerAvailability.mockReturnValue({
        data: mockAvailabilityData,
        isLoading: false,
        error: null,
      });

      const mockMutate = vi
        .fn()
        .mockRejectedValue(new Error("Invalid time range"));
      useUpdateTrainerAvailability.mockReturnValue({
        mutateAsync: mockMutate,
        isPending: false,
      });

      renderComponent();

      const availabilityTab = screen.getByRole("tab", {
        name: /availability/i,
      });
      await user.click(availabilityTab);

      const blockButton = screen.getByRole("button", {
        name: /block time slot/i,
      });
      await user.click(blockButton);

      // Enter invalid time range (end before start)
      const startTime = screen.getByRole("textbox", { name: /start time/i });
      const endTime = screen.getByRole("textbox", { name: /end time/i });

      await user.type(startTime, "10:00");
      await user.type(endTime, "09:00");

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid time range/i)).toBeInTheDocument();
      });
    });
  });

  describe("Performance & Integration", () => {
    it("should handle large session datasets efficiently", async () => {
      const largeMockSessions = Array.from({ length: 200 }, (_, i) => ({
        id: `session-${i}`,
        scheduled_start: `2024-01-01T10:00:00Z`,
        scheduled_end: `2024-01-01T11:00:00Z`,
        status: "completed",
        location: `Location ${i}`,
        max_participants: 3,
        current_participants: 2,
        participants: [],
        attendance_rate: 95,
      }));

      const {
        useTrainerSessions,
      } = require("@/features/trainers/hooks/use-trainer-sessions");
      const {
        useTrainerAnalytics,
      } = require("@/features/trainers/hooks/use-trainer-analytics");
      const {
        useTrainerAvailability,
      } = require("@/features/trainers/hooks/use-trainer-availability");

      useTrainerSessions.mockReturnValue({
        data: largeMockSessions,
        isLoading: false,
        error: null,
      });

      useTrainerAnalytics.mockReturnValue({
        data: mockTrainerAnalytics,
        isLoading: false,
        error: null,
      });

      useTrainerAvailability.mockReturnValue({
        data: mockAvailabilityData,
        isLoading: false,
        error: null,
      });

      renderComponent();

      const sessionsTab = screen.getByRole("tab", { name: /sessions/i });
      await user.click(sessionsTab);

      await waitFor(() => {
        // Should implement virtualization for large lists
        const renderedItems = screen.getAllByTestId(/session-item-/);
        expect(renderedItems.length).toBeLessThan(50);
      });
    });

    it("should support keyboard navigation", async () => {
      const {
        useTrainerSessions,
      } = require("@/features/trainers/hooks/use-trainer-sessions");
      const {
        useTrainerAnalytics,
      } = require("@/features/trainers/hooks/use-trainer-analytics");
      const {
        useTrainerAvailability,
      } = require("@/features/trainers/hooks/use-trainer-availability");

      useTrainerSessions.mockReturnValue({
        data: mockTrainerSessions,
        isLoading: false,
        error: null,
      });

      useTrainerAnalytics.mockReturnValue({
        data: mockTrainerAnalytics,
        isLoading: false,
        error: null,
      });

      useTrainerAvailability.mockReturnValue({
        data: mockAvailabilityData,
        isLoading: false,
        error: null,
      });

      renderComponent();

      const overviewTab = screen.getByRole("tab", { name: /overview/i });
      overviewTab.focus();

      // Navigate to sessions tab with arrow key
      fireEvent.keyDown(overviewTab, { key: "ArrowRight" });

      const sessionsTab = screen.getByRole("tab", { name: /sessions/i });
      expect(sessionsTab).toHaveFocus();

      // Activate with Enter
      fireEvent.keyDown(sessionsTab, { key: "Enter" });

      await waitFor(() => {
        expect(sessionsTab).toHaveAttribute("aria-selected", "true");
      });
    });

    it("should integrate with existing trainer hooks correctly", () => {
      const {
        useTrainerSessions,
      } = require("@/features/trainers/hooks/use-trainer-sessions");
      const {
        useTrainerAnalytics,
      } = require("@/features/trainers/hooks/use-trainer-analytics");
      const {
        useTrainerAvailability,
      } = require("@/features/trainers/hooks/use-trainer-availability");

      useTrainerSessions.mockReturnValue({
        data: mockTrainerSessions,
        isLoading: false,
        error: null,
      });

      useTrainerAnalytics.mockReturnValue({
        data: mockTrainerAnalytics,
        isLoading: false,
        error: null,
      });

      useTrainerAvailability.mockReturnValue({
        data: mockAvailabilityData,
        isLoading: false,
        error: null,
      });

      renderComponent();

      // Verify hooks were called with correct parameters
      expect(useTrainerSessions).toHaveBeenCalledWith(
        "trainer-123",
        expect.any(Object)
      );
      expect(useTrainerAnalytics).toHaveBeenCalledWith("trainer-123");
      expect(useTrainerAvailability).toHaveBeenCalledWith("trainer-123");
    });
  });
});
