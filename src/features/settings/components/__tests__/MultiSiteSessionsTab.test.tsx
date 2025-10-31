/**
 * Multi-Site Sessions Tab Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MultiSiteSessionsTab } from "../MultiSiteSessionsTab";
import * as multiSiteDb from "../../lib/multi-site-sessions-db";

// Mock dependencies
vi.mock("../../lib/multi-site-sessions-db");

describe("MultiSiteSessionsTab", () => {
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

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockSessions = [
    {
      id: "session-1",
      scheduled_start: "2025-10-18T10:00:00Z",
      guest_first_name: "John",
      guest_last_name: "Doe",
      guest_gym_name: "Downtown Studio",
      trainer_id: "trainer-1",
      trainer_name: "Jane Smith",
      status: "completed" as const,
      notes: "Test session",
      session_date: "2025-10-18",
      session_time: "10:00",
    },
    {
      id: "session-2",
      scheduled_start: "2025-10-19T14:00:00Z",
      guest_first_name: "Alice",
      guest_last_name: "Johnson",
      guest_gym_name: "Uptown Studio",
      trainer_id: "trainer-2",
      trainer_name: "Bob Wilson",
      status: "scheduled" as const,
      notes: null,
      session_date: "2025-10-19",
      session_time: "14:00",
    },
  ];

  const mockStudios = ["Downtown Studio", "Uptown Studio"];

  it("should render the component with sessions", async () => {
    vi.mocked(multiSiteDb.getMultiSiteSessions).mockResolvedValue(mockSessions);
    vi.mocked(multiSiteDb.getOriginStudios).mockResolvedValue(mockStudios);

    render(<MultiSiteSessionsTab />, { wrapper });

    // Check for title
    expect(screen.getByText("Multi-Site Sessions")).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    });

    // Check for studio names
    expect(screen.getByText("Downtown Studio")).toBeInTheDocument();
    expect(screen.getByText("Uptown Studio")).toBeInTheDocument();
  });

  it("should show loading state", () => {
    vi.mocked(multiSiteDb.getMultiSiteSessions).mockImplementation(
      () => new Promise(() => {})
    );
    vi.mocked(multiSiteDb.getOriginStudios).mockImplementation(
      () => new Promise(() => {})
    );

    render(<MultiSiteSessionsTab />, { wrapper });

    // Should show loading spinner
    expect(screen.getByText("Multi-Site Sessions")).toBeInTheDocument();
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("should show error state", async () => {
    vi.mocked(multiSiteDb.getMultiSiteSessions).mockRejectedValue(
      new Error("Fetch failed")
    );
    vi.mocked(multiSiteDb.getOriginStudios).mockResolvedValue(mockStudios);

    render(<MultiSiteSessionsTab />, { wrapper });

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to load multi-site sessions/i)
      ).toBeInTheDocument();
    });
  });

  it("should show empty state when no sessions", async () => {
    vi.mocked(multiSiteDb.getMultiSiteSessions).mockResolvedValue([]);
    vi.mocked(multiSiteDb.getOriginStudios).mockResolvedValue([]);

    render(<MultiSiteSessionsTab />, { wrapper });

    await waitFor(() => {
      expect(
        screen.getByText(/No multi-site sessions found/i)
      ).toBeInTheDocument();
    });
  });

  it("should have search input", async () => {
    vi.mocked(multiSiteDb.getMultiSiteSessions).mockResolvedValue(mockSessions);
    vi.mocked(multiSiteDb.getOriginStudios).mockResolvedValue(mockStudios);

    render(<MultiSiteSessionsTab />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    // Verify search input exists
    const searchInput = screen.getByPlaceholderText(/Search by member name/i);
    expect(searchInput).toBeInTheDocument();
  });

  it("should have export CSV button", async () => {
    vi.mocked(multiSiteDb.getMultiSiteSessions).mockResolvedValue(mockSessions);
    vi.mocked(multiSiteDb.getOriginStudios).mockResolvedValue(mockStudios);

    render(<MultiSiteSessionsTab />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    // Check for export CSV button
    expect(
      screen.getByRole("button", { name: /Export CSV/i })
    ).toBeInTheDocument();
  });

  it("should show session count", async () => {
    vi.mocked(multiSiteDb.getMultiSiteSessions).mockResolvedValue(mockSessions);
    vi.mocked(multiSiteDb.getOriginStudios).mockResolvedValue(mockStudios);

    render(<MultiSiteSessionsTab />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/2 sessions found/i)).toBeInTheDocument();
    });
  });

  it("should show view details button for each session", async () => {
    vi.mocked(multiSiteDb.getMultiSiteSessions).mockResolvedValue(mockSessions);
    vi.mocked(multiSiteDb.getOriginStudios).mockResolvedValue(mockStudios);

    render(<MultiSiteSessionsTab />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    // Should have 2 view detail buttons (one per session)
    const viewButtons = screen.getAllByRole("button", { name: "" });
    const eyeButtons = viewButtons.filter((btn) =>
      btn.querySelector('svg[class*="lucide-eye"]')
    );
    expect(eyeButtons).toHaveLength(2);
  });
});
