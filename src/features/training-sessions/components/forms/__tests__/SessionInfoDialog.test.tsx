import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionInfoDialog } from "../SessionInfoDialog";
import * as useTrainingSessions from "../../../hooks/use-training-sessions";
import * as useSessionAlerts from "../../../hooks/use-session-alerts";

// Mock Next.js Link component
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const mockSession = {
  id: "session-1",
  machine_id: "machine-1",
  machine_name: "Machine 1",
  trainer_id: "trainer-1",
  trainer_name: "John Trainer",
  scheduled_start: "2025-01-15T10:00:00Z",
  scheduled_end: "2025-01-15T10:30:00Z",
  status: "scheduled" as const,
  session_type: "standard" as const,
  notes: "Test session notes",
  participants: [
    {
      id: "member-1",
      name: "Jane Doe",
      email: "jane@example.com",
    },
  ],
};

const mockAlerts = [
  {
    id: "alert-1",
    member_id: "member-1",
    author: "Admin User",
    body: "Payment due for membership renewal",
    due_date: "2025-01-20",
    created_at: "2025-01-10T10:00:00Z",
    updated_at: "2025-01-10T10:00:00Z",
  },
  {
    id: "alert-2",
    member_id: "member-1",
    author: "Coach Mike",
    body: "Schedule follow-up session",
    due_date: "2025-01-18",
    created_at: "2025-01-11T10:00:00Z",
    updated_at: "2025-01-11T10:00:00Z",
  },
];

describe("SessionInfoDialog", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = (props: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sessionId?: string;
    onEditClick?: () => void;
  }) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <SessionInfoDialog {...props} />
      </QueryClientProvider>
    );
  };

  it("should render loading state while fetching session data", () => {
    vi.spyOn(useTrainingSessions, "useTrainingSession").mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    renderComponent({
      open: true,
      onOpenChange: vi.fn(),
      sessionId: "session-1",
    });

    expect(screen.getByText("Loading Session")).toBeInTheDocument();
    expect(screen.getByText("Loading session data...")).toBeInTheDocument();
  });

  it("should render error state when session fails to load", () => {
    vi.spyOn(useTrainingSessions, "useTrainingSession").mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Failed to fetch"),
    } as any);

    renderComponent({
      open: true,
      onOpenChange: vi.fn(),
      sessionId: "session-1",
    });

    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(
      screen.getByText("Failed to load session data. Please try again.")
    ).toBeInTheDocument();
  });

  it("should render session information correctly", async () => {
    vi.spyOn(useTrainingSessions, "useTrainingSession").mockReturnValue({
      data: mockSession,
      isLoading: false,
      error: null,
    } as any);

    vi.spyOn(useSessionAlerts, "useSessionAlerts").mockReturnValue({
      data: [],
    } as any);

    renderComponent({
      open: true,
      onOpenChange: vi.fn(),
      sessionId: "session-1",
    });

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    });

    expect(screen.getByText("Machine 1")).toBeInTheDocument();
    expect(screen.getByText("John Trainer")).toBeInTheDocument();
    expect(screen.getByText("Standard Session")).toBeInTheDocument();
    expect(screen.getByText("Test session notes")).toBeInTheDocument();
  });

  it("should display active alerts with content and due dates", async () => {
    vi.spyOn(useTrainingSessions, "useTrainingSession").mockReturnValue({
      data: mockSession,
      isLoading: false,
      error: null,
    } as any);

    vi.spyOn(useSessionAlerts, "useSessionAlerts").mockReturnValue({
      data: mockAlerts,
    } as any);

    renderComponent({
      open: true,
      onOpenChange: vi.fn(),
      sessionId: "session-1",
    });

    await waitFor(() => {
      expect(screen.getByText("Active Alerts (2)")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Payment due for membership renewal")
    ).toBeInTheDocument();
    expect(screen.getByText("Admin User")).toBeInTheDocument();
    expect(screen.getByText(/January 20th, 2025/)).toBeInTheDocument();

    expect(screen.getByText("Schedule follow-up session")).toBeInTheDocument();
    expect(screen.getByText("Coach Mike")).toBeInTheDocument();
    expect(screen.getByText(/January 18th, 2025/)).toBeInTheDocument();
  });

  it("should not display alerts section when there are no alerts", async () => {
    vi.spyOn(useTrainingSessions, "useTrainingSession").mockReturnValue({
      data: mockSession,
      isLoading: false,
      error: null,
    } as any);

    vi.spyOn(useSessionAlerts, "useSessionAlerts").mockReturnValue({
      data: [],
    } as any);

    renderComponent({
      open: true,
      onOpenChange: vi.fn(),
      sessionId: "session-1",
    });

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    });

    expect(screen.queryByText(/Active Alerts/)).not.toBeInTheDocument();
  });

  it("should render member name with clickable View Profile badge", async () => {
    vi.spyOn(useTrainingSessions, "useTrainingSession").mockReturnValue({
      data: mockSession,
      isLoading: false,
      error: null,
    } as any);

    vi.spyOn(useSessionAlerts, "useSessionAlerts").mockReturnValue({
      data: [],
    } as any);

    renderComponent({
      open: true,
      onOpenChange: vi.fn(),
      sessionId: "session-1",
    });

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    });

    const viewProfileLink = screen.getByRole("link", { name: /View Profile/i });
    expect(viewProfileLink).toHaveAttribute("href", "/members/member-1");
  });

  it("should call onEditClick when Edit button is clicked", async () => {
    const onEditClick = vi.fn();

    vi.spyOn(useTrainingSessions, "useTrainingSession").mockReturnValue({
      data: mockSession,
      isLoading: false,
      error: null,
    } as any);

    vi.spyOn(useSessionAlerts, "useSessionAlerts").mockReturnValue({
      data: [],
    } as any);

    renderComponent({
      open: true,
      onOpenChange: vi.fn(),
      sessionId: "session-1",
      onEditClick,
    });

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    });

    const editButton = screen.getByRole("button", { name: /Edit/i });
    await userEvent.click(editButton);

    expect(onEditClick).toHaveBeenCalledTimes(1);
  });

  it("should call onOpenChange when Close button is clicked", async () => {
    const onOpenChange = vi.fn();

    vi.spyOn(useTrainingSessions, "useTrainingSession").mockReturnValue({
      data: mockSession,
      isLoading: false,
      error: null,
    } as any);

    vi.spyOn(useSessionAlerts, "useSessionAlerts").mockReturnValue({
      data: [],
    } as any);

    renderComponent({
      open: true,
      onOpenChange,
      sessionId: "session-1",
    });

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole("button", { name: /Close/i });
    // The actual close button (not from error dialog)
    const closeButton = buttons[buttons.length - 1];
    await userEvent.click(closeButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("should display 'No trainer assigned' when trainer is not set", async () => {
    const sessionWithoutTrainer = {
      ...mockSession,
      trainer_id: null,
      trainer_name: null,
    };

    vi.spyOn(useTrainingSessions, "useTrainingSession").mockReturnValue({
      data: sessionWithoutTrainer,
      isLoading: false,
      error: null,
    } as any);

    vi.spyOn(useSessionAlerts, "useSessionAlerts").mockReturnValue({
      data: [],
    } as any);

    renderComponent({
      open: true,
      onOpenChange: vi.fn(),
      sessionId: "session-1",
    });

    await waitFor(() => {
      expect(screen.getByText("No trainer assigned")).toBeInTheDocument();
    });
  });

  it("should not display notes section when notes are empty", async () => {
    const sessionWithoutNotes = {
      ...mockSession,
      notes: null,
    };

    vi.spyOn(useTrainingSessions, "useTrainingSession").mockReturnValue({
      data: sessionWithoutNotes,
      isLoading: false,
      error: null,
    } as any);

    vi.spyOn(useSessionAlerts, "useSessionAlerts").mockReturnValue({
      data: [],
    } as any);

    renderComponent({
      open: true,
      onOpenChange: vi.fn(),
      sessionId: "session-1",
    });

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    });

    expect(screen.queryByText("Test session notes")).not.toBeInTheDocument();
  });
});
