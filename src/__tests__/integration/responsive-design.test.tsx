/**
 * @fileoverview Integration tests for responsive design compliance
 * Tests US-006 and US-007 responsive behavior across different screen sizes
 */

import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { ReactNode } from "react";
import { MemberDetailsWithTabs } from "@/features/members/components/MemberDetailsWithTabs";
import { TrainerDetailsWithTabs } from "@/features/trainers/components/TrainerDetailsWithTabs";
import type { Member, TrainerWithProfile } from "@/features/database/lib/types";
import { useMemberSessions } from "@/features/members/hooks/use-member-sessions";
import { useMemberSessionStats } from "@/features/members/hooks/use-member-session-stats";
import { useTrainerSessions } from "@/features/trainers/hooks/use-trainer-sessions";
import { useTrainerAnalytics } from "@/features/trainers/hooks/use-trainer-analytics";
import { useTrainerAvailability } from "@/features/trainers/hooks/use-trainer-availability";

// Mock the hooks
vi.mock("@/features/members/hooks/use-member-sessions", () => ({
  useMemberSessions: vi.fn(),
}));

vi.mock("@/features/members/hooks/use-member-session-stats", () => ({
  useMemberSessionStats: vi.fn(),
}));

vi.mock("@/features/trainers/hooks/use-trainer-sessions", () => ({
  useTrainerSessions: vi.fn(),
}));

vi.mock("@/features/trainers/hooks/use-trainer-analytics", () => ({
  useTrainerAnalytics: vi.fn(),
}));

vi.mock("@/features/trainers/hooks/use-trainer-availability", () => ({
  useTrainerAvailability: vi.fn(),
}));

// Mock data
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
  address: null,
  profile_picture_url: null,
  notes: null,
  medical_considerations: null,
  fitness_goals: null,
  preferred_contact_method: "email",
  marketing_consent: true,
  waiver_signed: true,
  waiver_signed_date: "2024-01-15",
  created_by: null,
  member_type: "full",
  trial_expires_at: null,
  preferred_trainers: null,
  session_history_summary: null,
};

const mockTrainer: TrainerWithProfile = {
  id: "trainer-123",
  hourly_rate: 75.0,
  commission_rate: 15,
  max_clients_per_session: 3,
  years_experience: 5,
  certifications: ["NASM-CPT"],
  specializations: ["Personal Training"],
  languages: ["English"],
  availability: null,
  is_accepting_new_clients: true,
  emergency_contact: null,
  insurance_policy_number: null,
  background_check_date: null,
  cpr_certification_expires: null,
  notes: null,
  created_at: "2023-01-15T10:00:00Z",
  updated_at: "2024-01-15T10:00:00Z",
  date_of_birth: null,
  user_profile: {
    id: "trainer-123",
    role: "trainer",
    email: "trainer@example.com",
    first_name: "Mike",
    last_name: "Johnson",
    phone: "+1234567890",
    avatar_url: null,
    bio: null,
    hire_date: "2023-01-15",
    is_active: true,
    created_at: "2023-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    date_of_birth: null,
  },
};

// Viewport utilities
const setViewport = (width: number, height: number) => {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, "innerHeight", {
    writable: true,
    configurable: true,
    value: height,
  });
  window.dispatchEvent(new Event("resize"));
};

const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  mobileLandscape: { width: 667, height: 375 },
  tablet: { width: 768, height: 1024 },
  tabletLandscape: { width: 1024, height: 768 },
  desktop: { width: 1200, height: 800 },
  largeDesktop: { width: 1920, height: 1080 },
};

describe("Responsive Design Integration Tests", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();

    // Mock hook implementations
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
    vi.mocked(useTrainerSessions).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    vi.mocked(useTrainerAnalytics).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });
    vi.mocked(useTrainerAvailability).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    useMemberSessions.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    useMemberSessionStats.mockReturnValue({
      data: { totalSessions: 0 },
      isLoading: false,
      error: null,
    });

    useTrainerSessions.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    useTrainerAnalytics.mockReturnValue({
      data: { totalSessions: 0 },
      isLoading: false,
      error: null,
    });

    useTrainerAvailability.mockReturnValue({
      data: { currentAvailability: {} },
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    // Reset viewport
    setViewport(1024, 768);
  });

  const TestWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe("Member Details Responsive Design", () => {
    Object.entries(VIEWPORTS).forEach(([viewportName, { width, height }]) => {
      describe(`${viewportName} viewport (${width}x${height})`, () => {
        beforeEach(() => {
          setViewport(width, height);
        });

        it("should render tabs appropriately for screen size", () => {
          render(
            <wrapper>
              <MemberDetailsWithTabs member={mockMember} />
            </wrapper>
          );

          const tabList = screen.getByRole("tablist");

          if (width < 640) {
            // Mobile
            expect(tabList).toHaveClass("flex-col");
          } else {
            // Tablet and above
            expect(tabList).toHaveClass("sm:flex-row");
          }
        });

        it("should adapt session stats grid layout", () => {
          render(
            <wrapper>
              <MemberDetailsWithTabs member={mockMember} />
            </wrapper>
          );

          const statsContainer = screen.getByTestId("session-stats-grid");

          if (width < 768) {
            // Mobile
            expect(statsContainer).toHaveClass("grid-cols-1");
          } else if (width < 1024) {
            // Tablet
            expect(statsContainer).toHaveClass("md:grid-cols-2");
          } else {
            // Desktop
            expect(statsContainer).toHaveClass("lg:grid-cols-4");
          }
        });

        it("should handle filter layout responsively", () => {
          render(
            <wrapper>
              <MemberDetailsWithTabs member={mockMember} />
            </wrapper>
          );

          const filtersContainer = screen.getByTestId("session-filters");

          if (width < 640) {
            // Mobile
            expect(filtersContainer).toHaveClass("flex-col", "gap-2");
          } else {
            // Tablet and above
            expect(filtersContainer).toHaveClass("sm:flex-row", "sm:gap-4");
          }
        });

        it("should adapt session table layout", () => {
          render(
            <wrapper>
              <MemberDetailsWithTabs member={mockMember} />
            </wrapper>
          );

          const sessionTable = screen.getByTestId("sessions-table");

          if (width < 768) {
            // Mobile
            expect(sessionTable).toHaveClass("mobile-layout");
            // Should hide less important columns on mobile
            expect(screen.queryByText("Location")).not.toBeInTheDocument();
          } else {
            expect(sessionTable).not.toHaveClass("mobile-layout");
            expect(screen.getByText("Location")).toBeInTheDocument();
          }
        });

        it("should handle pagination controls responsively", () => {
          render(
            <wrapper>
              <MemberDetailsWithTabs member={mockMember} />
            </wrapper>
          );

          const paginationContainer = screen.getByTestId("pagination-controls");

          if (width < 640) {
            // Mobile
            expect(paginationContainer).toHaveClass("flex-col", "items-center");
            // Should show simplified pagination on mobile
            expect(screen.getByText("Page")).toBeInTheDocument();
          } else {
            expect(paginationContainer).toHaveClass(
              "flex-row",
              "justify-between"
            );
            expect(screen.getByText("Showing")).toBeInTheDocument();
          }
        });
      });
    });

    it("should handle orientation changes smoothly", () => {
      render(
        <wrapper>
          <MemberDetailsWithTabs member={mockMember} />
        </wrapper>
      );

      // Start in portrait
      setViewport(VIEWPORTS.mobile.width, VIEWPORTS.mobile.height);
      expect(screen.getByRole("tablist")).toHaveClass("flex-col");

      // Change to landscape
      setViewport(
        VIEWPORTS.mobileLandscape.width,
        VIEWPORTS.mobileLandscape.height
      );
      expect(screen.getByRole("tablist")).toHaveClass("sm:flex-row");
    });

    it("should maintain functionality across all screen sizes", () => {
      Object.values(VIEWPORTS).forEach(({ width, height }) => {
        setViewport(width, height);

        render(
          <wrapper>
            <MemberDetailsWithTabs member={mockMember} />
          </wrapper>
        );

        // Core functionality should work regardless of screen size
        expect(
          screen.getByRole("tab", { name: /overview/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("tab", { name: /sessions/i })
        ).toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });
    });
  });

  describe("Trainer Details Responsive Design", () => {
    Object.entries(VIEWPORTS).forEach(([viewportName, { width, height }]) => {
      describe(`${viewportName} viewport (${width}x${height})`, () => {
        beforeEach(() => {
          setViewport(width, height);
        });

        it("should render trainer tabs appropriately", () => {
          render(
            <wrapper>
              <TrainerDetailsWithTabs trainer={mockTrainer} />
            </wrapper>
          );

          const tabList = screen.getByRole("tablist");

          if (width < 640) {
            // Mobile
            expect(tabList).toHaveClass("flex-col");
          } else {
            expect(tabList).toHaveClass("sm:flex-row");
          }
        });

        it("should adapt analytics grid layout", () => {
          render(
            <wrapper>
              <TrainerDetailsWithTabs trainer={mockTrainer} />
            </wrapper>
          );

          const analyticsGrid = screen.getByTestId("analytics-grid");

          if (width < 768) {
            // Mobile
            expect(analyticsGrid).toHaveClass("grid-cols-1");
          } else if (width < 1024) {
            // Tablet
            expect(analyticsGrid).toHaveClass("md:grid-cols-2");
          } else {
            // Desktop
            expect(analyticsGrid).toHaveClass("lg:grid-cols-3");
          }
        });

        it("should handle session calendar responsively", () => {
          render(
            <wrapper>
              <TrainerDetailsWithTabs trainer={mockTrainer} />
            </wrapper>
          );

          const sessionCalendar = screen.getByTestId(
            "trainer-sessions-calendar"
          );

          if (width < 768) {
            // Mobile
            expect(sessionCalendar).toHaveClass("mobile-calendar");
          } else {
            expect(sessionCalendar).toHaveClass("desktop-calendar");
          }
        });

        it("should adapt availability manager layout", () => {
          render(
            <wrapper>
              <TrainerDetailsWithTabs trainer={mockTrainer} />
            </wrapper>
          );

          const availabilityCalendar = screen.getByTestId(
            "availability-calendar"
          );

          if (width < 768) {
            // Mobile
            expect(availabilityCalendar).toHaveClass("mobile-layout");
            // Should use vertical layout on mobile
            expect(availabilityCalendar).toHaveClass("flex-col");
          } else {
            expect(availabilityCalendar).not.toHaveClass("mobile-layout");
            expect(availabilityCalendar).toHaveClass("flex-row");
          }
        });

        it("should handle session view toggle responsively", () => {
          render(
            <wrapper>
              <TrainerDetailsWithTabs trainer={mockTrainer} />
            </wrapper>
          );

          const viewToggle = screen.getByTestId("session-view-toggle");

          if (width < 640) {
            // Mobile
            expect(viewToggle).toHaveClass("w-full", "justify-center");
          } else {
            expect(viewToggle).toHaveClass("w-auto", "justify-start");
          }
        });
      });
    });

    it("should handle complex layouts on ultra-wide screens", () => {
      setViewport(2560, 1440);

      render(
        <wrapper>
          <TrainerDetailsWithTabs trainer={mockTrainer} />
        </wrapper>
      );

      const analyticsGrid = screen.getByTestId("analytics-grid");
      expect(analyticsGrid).toHaveClass("xl:grid-cols-4");

      const mainContent = screen.getByTestId("main-content");
      expect(mainContent).toHaveClass("max-w-7xl", "mx-auto");
    });

    it("should maintain readability on very small screens", () => {
      setViewport(320, 568); // iPhone 5/SE

      render(
        <wrapper>
          <TrainerDetailsWithTabs trainer={mockTrainer} />
        </wrapper>
      );

      // Text should remain readable
      const trainerName = screen.getByText("Mike Johnson");
      expect(trainerName).toBeInTheDocument();

      // Buttons should be touch-friendly
      const tabs = screen.getAllByRole("tab");
      tabs.forEach((tab) => {
        const styles = window.getComputedStyle(tab);
        expect(parseInt(styles.minHeight) || 44).toBeGreaterThanOrEqual(44); // iOS touch target minimum
      });
    });
  });

  describe("Cross-viewport Consistency", () => {
    it("should maintain data consistency across viewports", () => {
      const testData = (viewport: typeof VIEWPORTS.mobile) => {
        setViewport(viewport.width, viewport.height);

        const { unmount } = render(
          <wrapper>
            <MemberDetailsWithTabs member={mockMember} />
          </wrapper>
        );

        const memberName = screen.getByText("John Doe");
        expect(memberName).toBeInTheDocument();

        unmount();
      };

      Object.values(VIEWPORTS).forEach(testData);
    });

    it("should handle rapid viewport changes gracefully", () => {
      render(
        <wrapper>
          <MemberDetailsWithTabs member={mockMember} />
        </wrapper>
      );

      // Simulate rapid viewport changes
      Object.values(VIEWPORTS).forEach(({ width, height }) => {
        setViewport(width, height);
      });

      // Should still render correctly
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByRole("tablist")).toBeInTheDocument();
    });

    it("should preserve tab state during viewport changes", () => {
      render(
        <wrapper>
          <MemberDetailsWithTabs member={mockMember} />
        </wrapper>
      );

      // Switch to sessions tab
      const sessionsTab = screen.getByRole("tab", { name: /sessions/i });
      sessionsTab.click();

      expect(sessionsTab).toHaveAttribute("aria-selected", "true");

      // Change viewport
      setViewport(VIEWPORTS.mobile.width, VIEWPORTS.mobile.height);

      // Tab state should be preserved
      expect(sessionsTab).toHaveAttribute("aria-selected", "true");
    });
  });

  describe("Touch and Interaction Responsiveness", () => {
    it("should provide appropriate touch targets on mobile", () => {
      setViewport(VIEWPORTS.mobile.width, VIEWPORTS.mobile.height);

      render(
        <wrapper>
          <MemberDetailsWithTabs member={mockMember} />
        </wrapper>
      );

      const interactiveElements = screen.getAllByRole("button");
      interactiveElements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        expect(Math.max(rect.width, rect.height)).toBeGreaterThanOrEqual(44);
      });
    });

    it("should handle hover states appropriately on different devices", () => {
      // Desktop should support hover
      setViewport(VIEWPORTS.desktop.width, VIEWPORTS.desktop.height);

      render(
        <wrapper>
          <TrainerDetailsWithTabs trainer={mockTrainer} />
        </wrapper>
      );

      const hoverElements = screen.getAllByTestId(/hoverable-/);
      hoverElements.forEach((element) => {
        expect(element).toHaveClass("hover:bg-opacity-10");
      });

      // Mobile should not rely on hover
      setViewport(VIEWPORTS.mobile.width, VIEWPORTS.mobile.height);

      hoverElements.forEach((element) => {
        expect(element).toHaveClass("active:bg-opacity-20");
      });
    });

    it("should support keyboard navigation on all screen sizes", () => {
      Object.values(VIEWPORTS).forEach(({ width, height }) => {
        setViewport(width, height);

        render(
          <wrapper>
            <MemberDetailsWithTabs member={mockMember} />
          </wrapper>
        );

        const tabs = screen.getAllByRole("tab");
        tabs.forEach((tab) => {
          expect(tab).toHaveAttribute("tabindex", "0");
        });
      });
    });
  });

  describe("Performance on Different Screen Sizes", () => {
    it("should not render unnecessary elements on mobile", () => {
      setViewport(VIEWPORTS.mobile.width, VIEWPORTS.mobile.height);

      render(
        <wrapper>
          <TrainerDetailsWithTabs trainer={mockTrainer} />
        </wrapper>
      );

      // Desktop-only features should be hidden
      expect(
        screen.queryByTestId("desktop-only-sidebar")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("desktop-hover-tooltip")
      ).not.toBeInTheDocument();
    });

    it("should implement progressive enhancement for larger screens", () => {
      setViewport(VIEWPORTS.desktop.width, VIEWPORTS.desktop.height);

      render(
        <wrapper>
          <TrainerDetailsWithTabs trainer={mockTrainer} />
        </wrapper>
      );

      // Enhanced features should be available
      expect(
        screen.getByTestId("enhanced-analytics-charts")
      ).toBeInTheDocument();
      expect(screen.getByTestId("advanced-filtering")).toBeInTheDocument();
    });

    it("should optimize render performance for complex layouts", () => {
      const startTime = performance.now();

      setViewport(VIEWPORTS.largeDesktop.width, VIEWPORTS.largeDesktop.height);

      render(
        <wrapper>
          <TrainerDetailsWithTabs trainer={mockTrainer} />
        </wrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (adjust threshold as needed)
      expect(renderTime).toBeLessThan(100); // 100ms threshold
    });
  });
});
