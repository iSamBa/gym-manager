/**
 * @fileoverview Performance integration tests for US-006 and US-007
 * Tests performance with large datasets, virtualization, and optimization
 */

import { render, screen, waitFor } from "@testing-library/react";
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

// Performance measurement utilities
const measurePerformance = (fn: () => void) => {
  const startTime = performance.now();
  fn();
  const endTime = performance.now();
  return endTime - startTime;
};

const generateLargeMemberSessionsDataset = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    member_id: "member-123",
    session_id: `session-${i}`,
    scheduled_start: new Date(
      2024,
      0,
      (i % 30) + 1,
      (i % 12) + 8
    ).toISOString(),
    scheduled_end: new Date(2024, 0, (i % 30) + 1, (i % 12) + 9).toISOString(),
    status: ["completed", "scheduled", "cancelled"][i % 3] as
      | "completed"
      | "scheduled"
      | "cancelled",
    location: `Location ${i % 10}`,
    notes: i % 3 === 0 ? `Session notes for session ${i}` : null,
    trainer_name: `Trainer ${(i % 5) + 1}`,
    booking_status: "confirmed" as const,
  }));
};

const generateLargeTrainerSessionsDataset = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `session-${i}`,
    trainer_id: "trainer-123",
    scheduled_start: new Date(
      2024,
      0,
      (i % 30) + 1,
      (i % 12) + 8
    ).toISOString(),
    scheduled_end: new Date(2024, 0, (i % 30) + 1, (i % 12) + 9).toISOString(),
    status: ["completed", "scheduled", "cancelled"][i % 3] as
      | "completed"
      | "scheduled"
      | "cancelled",
    location: `Location ${i % 10}`,
    notes: i % 3 === 0 ? `Session notes for session ${i}` : null,
    max_participants: 3,
    current_participants: Math.min(i % 4, 3),
    trainer_name: "Mike Johnson",
    participants: Array.from({ length: Math.min(i % 4, 3) }, (_, j) => ({
      id: `member-${i}-${j}`,
      name: `Member ${i}-${j}`,
      email: `member${i}-${j}@example.com`,
    })),
    attendance_rate: Math.random() * 100,
  }));
};

const generateLargeAnalyticsDataset = (sessionCount: number) => {
  const sessions = generateLargeTrainerSessionsDataset(sessionCount);
  return {
    totalSessions: sessionCount,
    completedSessions: sessions.filter((s) => s.status === "completed").length,
    cancelledSessions: sessions.filter((s) => s.status === "cancelled").length,
    upcomingSessions: sessions.filter((s) => s.status === "scheduled").length,
    sessionCompletionRate:
      (sessions.filter((s) => s.status === "completed").length / sessionCount) *
      100,
    averageAttendancePerSession:
      sessions.reduce((acc, s) => acc + s.current_participants, 0) /
      sessionCount,
    utilizationRate: Math.random() * 100,
    peakHours: Array.from({ length: 12 }, (_, i) => ({
      time_slot: `${i + 8}:00-${i + 9}:00`,
      session_count: Math.floor(Math.random() * 20) + 1,
    })),
    clientRetentionMetrics: {
      newClients: Math.floor(sessionCount * 0.3),
      returningClients: Math.floor(sessionCount * 0.7),
      retentionRate: 70 + Math.random() * 20,
    },
    monthlyTrends: Array.from({ length: 12 }, (_, i) => ({
      month: `2024-${String(i + 1).padStart(2, "0")}`,
      sessions: Math.floor(sessionCount / 12) + Math.floor(Math.random() * 10),
      revenue:
        (Math.floor(sessionCount / 12) + Math.floor(Math.random() * 10)) * 75,
    })),
    topClients: Array.from({ length: 10 }, (_, i) => ({
      client_name: `Top Client ${i + 1}`,
      session_count: Math.floor(Math.random() * 20) + 5,
    })),
    revenueGenerated: sessionCount * 75 * 0.8,
    averageSessionRating: 4.5 + Math.random() * 0.5,
  };
};

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

// Mock hooks
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

describe("Performance Integration Tests", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const TestWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe("Large Dataset Performance - Member Details", () => {
    [100, 500, 1000, 5000].forEach((datasetSize) => {
      describe(`Dataset size: ${datasetSize} sessions`, () => {
        beforeEach(() => {
          vi.mocked(useMemberSessions).mockReturnValue({
            data: largeSessions,
            isLoading: false,
            error: null,
          });
          vi.mocked(useMemberSessionStats).mockReturnValue({
            data: largeStats,
            isLoading: false,
            error: null,
          });

          const largeSessions = generateLargeMemberSessionsDataset(datasetSize);
          const largeStats = {
            totalSessions: datasetSize,
            completedSessions: Math.floor(datasetSize * 0.7),
            cancelledSessions: Math.floor(datasetSize * 0.1),
            upcomingSessions: Math.floor(datasetSize * 0.2),
            attendanceRate: 85.5,
            favoriteTrainers: [
              {
                trainer_name: "Trainer 1",
                session_count: Math.floor(datasetSize * 0.3),
              },
              {
                trainer_name: "Trainer 2",
                session_count: Math.floor(datasetSize * 0.2),
              },
            ],
            preferredTimeSlots: [
              {
                time_slot: "10:00-11:00",
                session_count: Math.floor(datasetSize * 0.2),
              },
              {
                time_slot: "14:00-15:00",
                session_count: Math.floor(datasetSize * 0.15),
              },
            ],
            monthlyTrends: Array.from({ length: 12 }, (_, i) => ({
              month: `2024-${String(i + 1).padStart(2, "0")}`,
              sessions: Math.floor(datasetSize / 12),
            })),
          };

          useMemberSessions.mockReturnValue({
            data: largeSessions,
            isLoading: false,
            error: null,
          });

          useMemberSessionStats.mockReturnValue({
            data: largeStats,
            isLoading: false,
            error: null,
          });
        });

        it("should render within performance threshold", async () => {
          const renderTime = measurePerformance(() => {
            render(
              <TestWrapper>
                <MemberDetailsWithTabs member={mockMember} />
              </TestWrapper>
            );
          });

          // Performance thresholds based on dataset size
          const threshold =
            datasetSize <= 100
              ? 50
              : datasetSize <= 500
                ? 100
                : datasetSize <= 1000
                  ? 200
                  : 300;

          expect(renderTime).toBeLessThan(threshold);
        });

        it("should implement virtualization for large lists", () => {
          render(
            <TestWrapper>
              <MemberDetailsWithTabs member={mockMember} />
            </TestWrapper>
          );

          if (datasetSize > 100) {
            const virtualList = screen.queryByTestId("virtual-session-list");
            expect(virtualList).toBeInTheDocument();

            // Should only render visible items
            const renderedItems = screen.getAllByTestId(/session-item-/);
            expect(renderedItems.length).toBeLessThan(
              Math.min(50, datasetSize)
            );
          }
        });

        it("should handle pagination efficiently", () => {
          render(
            <TestWrapper>
              <MemberDetailsWithTabs member={mockMember} />
            </TestWrapper>
          );

          if (datasetSize > 20) {
            expect(
              screen.getByTestId("pagination-controls")
            ).toBeInTheDocument();

            const paginationInfo = screen.getByTestId("pagination-info");
            expect(paginationInfo).toHaveTextContent(`1-20 of ${datasetSize}`);
          }
        });

        it("should optimize filter operations", async () => {
          render(
            <TestWrapper>
              <MemberDetailsWithTabs member={mockMember} />
            </TestWrapper>
          );

          const filterTime = measurePerformance(async () => {
            const statusFilter = screen.getByRole("combobox", {
              name: /status/i,
            });
            statusFilter.dispatchEvent(new Event("change", { bubbles: true }));

            await waitFor(
              () => {
                expect(
                  screen.getByTestId("filtered-results")
                ).toBeInTheDocument();
              },
              { timeout: 1000 }
            );
          });

          // Filter operations should be fast regardless of dataset size
          expect(filterTime).toBeLessThan(500);
        });

        it("should maintain memory efficiency", () => {
          const initialMemory = performance.memory?.usedJSHeapSize || 0;

          render(
            <TestWrapper>
              <MemberDetailsWithTabs member={mockMember} />
            </TestWrapper>
          );

          const afterRenderMemory = performance.memory?.usedJSHeapSize || 0;
          const memoryIncrease = afterRenderMemory - initialMemory;

          // Memory increase should be reasonable (adjust based on requirements)
          const maxMemoryIncrease = datasetSize * 1000; // 1KB per item threshold
          expect(memoryIncrease).toBeLessThan(maxMemoryIncrease);
        });
      });
    });

    it("should handle extremely large datasets gracefully", () => {
      vi.mocked(useMemberSessions).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });
      const extremeDataset = generateLargeMemberSessionsDataset(50000);

      useMemberSessions.mockReturnValue({
        data: extremeDataset,
        isLoading: false,
        error: null,
      });

      const renderTime = measurePerformance(() => {
        render(
          <wrapper>
            <MemberDetailsWithTabs member={mockMember} />
          </wrapper>
        );
      });

      // Should still render within reasonable time
      expect(renderTime).toBeLessThan(1000);

      // Should show warning for large datasets
      expect(screen.getByTestId("large-dataset-warning")).toBeInTheDocument();
    });
  });

  describe("Large Dataset Performance - Trainer Details", () => {
    [100, 500, 1000, 5000].forEach((datasetSize) => {
      describe(`Dataset size: ${datasetSize} sessions`, () => {
        beforeEach(() => {
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

          const largeSessions =
            generateLargeTrainerSessionsDataset(datasetSize);
          const largeAnalytics = generateLargeAnalyticsDataset(datasetSize);

          useTrainerSessions.mockReturnValue({
            data: largeSessions,
            isLoading: false,
            error: null,
          });

          useTrainerAnalytics.mockReturnValue({
            data: largeAnalytics,
            isLoading: false,
            error: null,
          });

          useTrainerAvailability.mockReturnValue({
            data: { currentAvailability: {} },
            isLoading: false,
            error: null,
          });
        });

        it("should render trainer details within performance threshold", async () => {
          const renderTime = measurePerformance(() => {
            render(
              <TestWrapper>
                <TrainerDetailsWithTabs trainer={mockTrainer} />
              </TestWrapper>
            );
          });

          const threshold =
            datasetSize <= 100
              ? 75
              : datasetSize <= 500
                ? 150
                : datasetSize <= 1000
                  ? 250
                  : 400;

          expect(renderTime).toBeLessThan(threshold);
        });

        it("should optimize analytics calculations", () => {
          const calculationTime = measurePerformance(() => {
            render(
              <TestWrapper>
                <TrainerDetailsWithTabs trainer={mockTrainer} />
              </TestWrapper>
            );
          });

          // Analytics calculations should be optimized
          expect(calculationTime).toBeLessThan(200);

          // Should show calculated metrics
          expect(screen.getByTestId("analytics-metrics")).toBeInTheDocument();
        });

        it("should implement efficient calendar rendering", () => {
          render(
            <TestWrapper>
              <TrainerDetailsWithTabs trainer={mockTrainer} />
            </TestWrapper>
          );

          const calendar = screen.getByTestId("trainer-sessions-calendar");
          expect(calendar).toBeInTheDocument();

          if (datasetSize > 500) {
            // Should use optimized calendar for large datasets
            expect(calendar).toHaveClass("optimized-calendar");
          }
        });

        it("should handle session view switching efficiently", async () => {
          render(
            <TestWrapper>
              <TrainerDetailsWithTabs trainer={mockTrainer} />
            </TestWrapper>
          );

          const switchTime = measurePerformance(() => {
            const listViewButton = screen.getByRole("button", {
              name: /list view/i,
            });
            listViewButton.click();
          });

          expect(switchTime).toBeLessThan(100);

          await waitFor(() => {
            expect(
              screen.getByTestId("sessions-list-view")
            ).toBeInTheDocument();
          });
        });
      });
    });
  });

  describe("Memory Management and Cleanup", () => {
    it("should properly cleanup on component unmount", () => {
      vi.mocked(useMemberSessions).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });
      const largeDataset = generateLargeMemberSessionsDataset(1000);

      useMemberSessions.mockReturnValue({
        data: largeDataset,
        isLoading: false,
        error: null,
      });

      const { unmount } = render(
        <wrapper>
          <MemberDetailsWithTabs member={mockMember} />
        </wrapper>
      );

      const beforeUnmountMemory = performance.memory?.usedJSHeapSize || 0;
      unmount();

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const afterUnmountMemory = performance.memory?.usedJSHeapSize || 0;

      // Memory should not significantly increase after unmount
      expect(afterUnmountMemory).toBeLessThanOrEqual(beforeUnmountMemory * 1.1);
    });

    it("should handle rapid component updates efficiently", () => {
      vi.mocked(useMemberSessions).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });
      let currentData = generateLargeMemberSessionsDataset(500);

      useMemberSessions.mockReturnValue({
        data: currentData,
        isLoading: false,
        error: null,
      });

      const { rerender } = render(
        <wrapper>
          <MemberDetailsWithTabs member={mockMember} />
        </wrapper>
      );

      const updateTime = measurePerformance(() => {
        // Simulate 10 rapid updates
        for (let i = 0; i < 10; i++) {
          currentData = generateLargeMemberSessionsDataset(500);
          useMemberSessions.mockReturnValue({
            data: currentData,
            isLoading: false,
            error: null,
          });
          rerender(
            <TestWrapper>
              <MemberDetailsWithTabs member={mockMember} />
            </TestWrapper>
          );
        }
      });

      expect(updateTime).toBeLessThan(500);
    });

    it("should implement efficient re-rendering strategies", () => {
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

      const sessions = generateLargeTrainerSessionsDataset(1000);
      const analytics = generateLargeAnalyticsDataset(1000);

      useTrainerSessions.mockReturnValue({
        data: sessions,
        isLoading: false,
        error: null,
      });

      useTrainerAnalytics.mockReturnValue({
        data: analytics,
        isLoading: false,
        error: null,
      });

      const { rerender } = render(
        <wrapper>
          <TrainerDetailsWithTabs trainer={mockTrainer} />
        </wrapper>
      );

      // Measure re-render time when only analytics change
      const rerenderTime = measurePerformance(() => {
        const newAnalytics = { ...analytics, totalSessions: 1001 };
        useTrainerAnalytics.mockReturnValue({
          data: newAnalytics,
          isLoading: false,
          error: null,
        });

        rerender(
          <wrapper>
            <TrainerDetailsWithTabs trainer={mockTrainer} />
          </wrapper>
        );
      });

      expect(rerenderTime).toBeLessThan(50);
    });
  });

  describe("Concurrent Operations Performance", () => {
    it("should handle multiple simultaneous filters efficiently", async () => {
      vi.mocked(useMemberSessions).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });
      const largeDataset = generateLargeMemberSessionsDataset(2000);

      useMemberSessions.mockReturnValue({
        data: largeDataset,
        isLoading: false,
        error: null,
      });

      render(
        <wrapper>
          <MemberDetailsWithTabs member={mockMember} />
        </wrapper>
      );

      const concurrentTime = measurePerformance(async () => {
        const statusFilter = screen.getByRole("combobox", { name: /status/i });
        const trainerFilter = screen.getByRole("combobox", {
          name: /trainer/i,
        });
        const searchInput = screen.getByRole("textbox", { name: /search/i });

        // Apply multiple filters simultaneously
        statusFilter.dispatchEvent(new Event("change", { bubbles: true }));
        trainerFilter.dispatchEvent(new Event("change", { bubbles: true }));
        searchInput.dispatchEvent(new Event("input", { bubbles: true }));

        await waitFor(
          () => {
            expect(screen.getByTestId("filtered-results")).toBeInTheDocument();
          },
          { timeout: 2000 }
        );
      });

      expect(concurrentTime).toBeLessThan(1000);
    });

    it("should handle tab switching with large datasets efficiently", () => {
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

      useTrainerSessions.mockReturnValue({
        data: generateLargeTrainerSessionsDataset(1000),
        isLoading: false,
        error: null,
      });

      useTrainerAnalytics.mockReturnValue({
        data: generateLargeAnalyticsDataset(1000),
        isLoading: false,
        error: null,
      });

      render(
        <wrapper>
          <TrainerDetailsWithTabs trainer={mockTrainer} />
        </wrapper>
      );

      const switchingTime = measurePerformance(() => {
        const sessionsTab = screen.getByRole("tab", { name: /sessions/i });
        sessionsTab.click();

        const analyticsTab = screen.getByRole("tab", { name: /analytics/i });
        analyticsTab.click();

        const availabilityTab = screen.getByRole("tab", {
          name: /availability/i,
        });
        availabilityTab.click();
      });

      expect(switchingTime).toBeLessThan(200);
    });

    it("should maintain performance during scroll events", () => {
      vi.mocked(useMemberSessions).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });
      const largeDataset = generateLargeMemberSessionsDataset(5000);

      useMemberSessions.mockReturnValue({
        data: largeDataset,
        isLoading: false,
        error: null,
      });

      render(
        <wrapper>
          <MemberDetailsWithTabs member={mockMember} />
        </wrapper>
      );

      const scrollContainer = screen.getByTestId("sessions-scroll-container");

      const scrollTime = measurePerformance(() => {
        // Simulate rapid scrolling
        for (let i = 0; i < 50; i++) {
          scrollContainer.scrollTop = i * 50;
          scrollContainer.dispatchEvent(new Event("scroll"));
        }
      });

      expect(scrollTime).toBeLessThan(100);
    });
  });

  describe("Progressive Loading and Optimization", () => {
    it("should implement progressive loading for analytics charts", async () => {
      vi.mocked(useTrainerAnalytics).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });
      const largeAnalytics = generateLargeAnalyticsDataset(10000);

      useTrainerAnalytics.mockReturnValue({
        data: largeAnalytics,
        isLoading: false,
        error: null,
      });

      render(
        <wrapper>
          <TrainerDetailsWithTabs trainer={mockTrainer} />
        </wrapper>
      );

      const analyticsTab = screen.getByRole("tab", { name: /analytics/i });
      analyticsTab.click();

      // Should show loading skeleton initially
      expect(screen.getByTestId("chart-loading-skeleton")).toBeInTheDocument();

      // Then progressively load chart components
      await waitFor(
        () => {
          expect(screen.getByTestId("analytics-chart-1")).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      await waitFor(
        () => {
          expect(screen.getByTestId("analytics-chart-2")).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it("should optimize image and asset loading", () => {
      render(
        <wrapper>
          <MemberDetailsWithTabs member={mockMember} />
        </wrapper>
      );

      // Images should use lazy loading
      const images = screen.getAllByRole("img");
      images.forEach((img) => {
        expect(img).toHaveAttribute("loading", "lazy");
      });

      // Charts should be loaded on demand
      const charts = screen.queryAllByTestId(/chart-/);
      expect(charts.length).toBe(0); // Not loaded until needed
    });

    it("should implement code splitting for heavy components", async () => {
      render(
        <wrapper>
          <TrainerDetailsWithTabs trainer={mockTrainer} />
        </wrapper>
      );

      const analyticsTab = screen.getByRole("tab", { name: /analytics/i });
      const loadTime = measurePerformance(() => {
        analyticsTab.click();
      });

      // Heavy analytics components should load quickly due to code splitting
      expect(loadTime).toBeLessThan(50);

      await waitFor(
        () => {
          expect(screen.getByTestId("analytics-content")).toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });
  });
});
