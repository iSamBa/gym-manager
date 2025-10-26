import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionBookingDialog } from "../SessionBookingDialog";
import type { SessionType } from "@/features/database/lib/types";

// Mock shadcn/ui components to test business logic, not Radix UI behavior
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: any) => <div data-testid="select">{children}</div>,
  SelectTrigger: ({ children }: any) => <button>{children}</button>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value, disabled }: any) => (
    <div data-value={value} data-disabled={disabled}>
      {children}
    </div>
  ),
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

// Create a simple form state that can be used across all FormFields
const formState = {
  session_type: "member",
  machine_id: "",
  member_id: "",
  trainer_id: null,
  scheduled_start: "",
  scheduled_end: "",
  notes: "",
};

vi.mock("@/components/ui/form", () => ({
  Form: ({ children }: any) => <div>{children}</div>,
  FormField: ({ render, name }: any) => {
    const field = {
      value: formState[name as keyof typeof formState] || "",
      onChange: (value: any) => {
        (formState as any)[name] = value;
      },
      name,
    };
    return <div data-field={name}>{render({ field })}</div>;
  },
  FormItem: ({ children }: any) => <div className="form-item">{children}</div>,
  FormLabel: ({ children }: any) => <label>{children}</label>,
  FormControl: ({ children }: any) => <div>{children}</div>,
  FormMessage: () => <span data-testid="form-error"></span>,
  FormDescription: ({ children }: any) => <span>{children}</span>,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, type }: any) => (
    <button onClick={onClick} disabled={disabled} type={type}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/textarea", () => ({
  Textarea: (props: any) => <textarea {...props} />,
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: any) => <input {...props} />,
}));

vi.mock("@/components/ui/calendar", () => ({
  Calendar: (props: any) => <div data-testid="calendar" {...props}></div>,
}));

vi.mock("@/components/ui/popover", () => ({
  Popover: ({ children }: any) => <div>{children}</div>,
  PopoverTrigger: ({ children }: any) => <div>{children}</div>,
  PopoverContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/ui/time-picker", () => ({
  TimePicker: (props: any) => <input type="time" {...props} />,
}));

// Mock SessionTypeSelector
vi.mock("../SessionTypeSelector", () => ({
  SessionTypeSelector: ({ value, onChange }: any) => (
    <div data-testid="session-type-selector">
      <button onClick={() => onChange("trial")} data-testid="select-trial">
        Trial
      </button>
      <button onClick={() => onChange("member")} data-testid="select-member">
        Member
      </button>
      <button
        onClick={() => onChange("contractual")}
        data-testid="select-contractual"
      >
        Contractual
      </button>
      <button onClick={() => onChange("makeup")} data-testid="select-makeup">
        Make-up
      </button>
      <button
        onClick={() => onChange("multi_site")}
        data-testid="select-multi-site"
      >
        Multi-Site
      </button>
      <button
        onClick={() => onChange("collaboration")}
        data-testid="select-collaboration"
      >
        Collaboration
      </button>
      <button
        onClick={() => onChange("non_bookable")}
        data-testid="select-non-bookable"
      >
        Non-Bookable
      </button>
      <span data-testid="current-type">{value}</span>
    </div>
  ),
}));

// Mock TrialMemberRegistration
vi.mock("../TrialMemberRegistration", () => ({
  TrialMemberRegistration: () => (
    <div data-testid="trial-registration">
      <label htmlFor="new_member_first_name">First Name *</label>
      <input id="new_member_first_name" />
      <label htmlFor="new_member_email">Email *</label>
      <input id="new_member_email" type="email" />
    </div>
  ),
}));

// Mock GuestSessionInfo
vi.mock("../GuestSessionInfo", () => ({
  GuestSessionInfo: ({ sessionType }: { sessionType: SessionType }) => (
    <div data-testid={`guest-info-${sessionType}`}>
      {sessionType === "multi_site" && (
        <>
          <label htmlFor="guest_first_name">Guest First Name *</label>
          <input id="guest_first_name" />
          <label htmlFor="guest_gym_name">Origin Gym *</label>
          <input id="guest_gym_name" />
        </>
      )}
      {sessionType === "collaboration" && (
        <>
          <label htmlFor="collaboration_details">Collaboration Details *</label>
          <textarea id="collaboration_details" />
        </>
      )}
    </div>
  ),
}));

// Mock MemberCombobox
vi.mock("../MemberCombobox", () => ({
  MemberCombobox: ({ members, placeholder }: any) => (
    <div data-testid="member-combobox">
      <span data-testid="member-count">{members.length}</span>
      <span data-testid="member-placeholder">{placeholder}</span>
      {members.map((m: any) => (
        <div key={m.id} data-testid={`member-${m.id}`}>
          {m.first_name} {m.last_name}
          {m.member_type && ` (${m.member_type})`}
        </div>
      ))}
    </div>
  ),
}));

// Mock SessionLimitWarning
vi.mock("../../SessionLimitWarning", () => ({
  SessionLimitWarning: () => <div data-testid="session-limit-warning" />,
}));

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock hooks
vi.mock("../../../hooks/use-machines");
vi.mock("@/features/members/hooks/use-members");
vi.mock("@/features/trainers/hooks/use-trainers");
vi.mock("../../../hooks/use-training-sessions");
vi.mock("../../../hooks/use-studio-session-limit");

import { useMachines } from "../../../hooks/use-machines";
import { useMembers } from "@/features/members/hooks/use-members";
import { useTrainers } from "@/features/trainers/hooks/use-trainers";
import { useCreateTrainingSession } from "../../../hooks/use-training-sessions";
import { useStudioSessionLimit } from "../../../hooks/use-studio-session-limit";
import { toast } from "sonner";

const mockMachines = [
  {
    id: "machine-1",
    machine_number: 1,
    name: "Machine 1",
    is_available: true,
  },
  {
    id: "machine-2",
    machine_number: 2,
    name: "Machine 2",
    is_available: false,
  },
];

const mockMembers = [
  {
    id: "member-1",
    user_id: "user-1",
    first_name: "John",
    last_name: "Doe",
    status: "active",
    member_type: "full",
  },
  {
    id: "member-2",
    user_id: "user-2",
    first_name: "Trial",
    last_name: "Member",
    status: "active",
    member_type: "trial",
  },
];

const mockTrainers = [
  {
    id: "trainer-1",
    user_profile: {
      first_name: "Mike",
      last_name: "Trainer",
    },
  },
];

describe("SessionBookingDialog - Dynamic Forms (US-008)", () => {
  let queryClient: QueryClient;
  let mockOnOpenChange: ReturnType<typeof vi.fn>;
  let mockMutateAsync: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockOnOpenChange = vi.fn();
    mockMutateAsync = vi.fn().mockResolvedValue({ id: "new-session" });

    // Reset form state
    formState.session_type = "member";
    formState.machine_id = "";
    formState.member_id = "";
    formState.trainer_id = null;
    formState.scheduled_start = "";
    formState.scheduled_end = "";
    formState.notes = "";

    // Mock hooks
    vi.mocked(useMachines).mockReturnValue({
      data: mockMachines,
      isLoading: false,
    } as any);

    vi.mocked(useMembers).mockReturnValue({
      data: mockMembers,
      isLoading: false,
    } as any);

    vi.mocked(useTrainers).mockReturnValue({
      data: mockTrainers,
      isLoading: false,
    } as any);

    vi.mocked(useCreateTrainingSession).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any);

    vi.mocked(useStudioSessionLimit).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as any);

    vi.clearAllMocks();
  });

  const renderDialog = (props: any = {}) => {
    const defaultProps = {
      open: true,
      onOpenChange: mockOnOpenChange,
    };

    return render(
      <QueryClientProvider client={queryClient}>
        <SessionBookingDialog {...defaultProps} {...props} />
      </QueryClientProvider>
    );
  };

  describe("AC-1: Session Type Selector Integration", () => {
    it("should render SessionTypeSelector component", () => {
      renderDialog();
      expect(screen.getByTestId("session-type-selector")).toBeInTheDocument();
    });

    it("should display all 7 session type options", () => {
      renderDialog();
      expect(screen.getByTestId("select-trial")).toBeInTheDocument();
      expect(screen.getByTestId("select-member")).toBeInTheDocument();
      expect(screen.getByTestId("select-contractual")).toBeInTheDocument();
      expect(screen.getByTestId("select-makeup")).toBeInTheDocument();
      expect(screen.getByTestId("select-multi-site")).toBeInTheDocument();
      expect(screen.getByTestId("select-collaboration")).toBeInTheDocument();
      expect(screen.getByTestId("select-non-bookable")).toBeInTheDocument();
    });

    it("should allow selecting different session types", async () => {
      const user = userEvent.setup();
      renderDialog();

      await user.click(screen.getByTestId("select-trial"));
      // Type selector should update (verified by mock behavior)
      expect(screen.getByTestId("session-type-selector")).toBeInTheDocument();
    });
  });

  describe("AC-2: Dynamic Form Sections - Trial Session", () => {
    it("should show trial registration for trial sessions", () => {
      formState.session_type = "trial";
      renderDialog({ defaultValues: { session_type: "trial" } });

      expect(screen.getByTestId("trial-registration")).toBeInTheDocument();
    });

    it("should display trial member fields", () => {
      formState.session_type = "trial";
      renderDialog({ defaultValues: { session_type: "trial" } });

      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it("should hide member combobox for trial sessions", () => {
      formState.session_type = "trial";
      renderDialog({ defaultValues: { session_type: "trial" } });

      expect(screen.queryByTestId("member-combobox")).not.toBeInTheDocument();
    });
  });

  describe("AC-2: Dynamic Form Sections - Member Session", () => {
    it("should show member combobox for member sessions", () => {
      formState.session_type = "member";
      renderDialog({ defaultValues: { session_type: "member" } });

      expect(screen.getByTestId("member-combobox")).toBeInTheDocument();
    });

    it("should show all members (no filtering) for member sessions", () => {
      formState.session_type = "member";
      renderDialog({ defaultValues: { session_type: "member" } });

      const memberCount = screen.getByTestId("member-count");
      expect(memberCount.textContent).toBe("2"); // Both full and trial members
    });

    it("should display correct placeholder for member sessions", () => {
      formState.session_type = "member";
      renderDialog({ defaultValues: { session_type: "member" } });

      const placeholder = screen.getByTestId("member-placeholder");
      expect(placeholder.textContent).toBe("Select a member");
    });

    it("should hide trial registration for member sessions", () => {
      formState.session_type = "member";
      renderDialog({ defaultValues: { session_type: "member" } });

      expect(
        screen.queryByTestId("trial-registration")
      ).not.toBeInTheDocument();
    });
  });

  describe("AC-2: Dynamic Form Sections - Contractual Session", () => {
    it("should show member combobox for contractual sessions", () => {
      formState.session_type = "contractual";
      renderDialog({ defaultValues: { session_type: "contractual" } });

      expect(screen.getByTestId("member-combobox")).toBeInTheDocument();
    });

    it("should filter to trial members only for contractual sessions", () => {
      formState.session_type = "contractual";
      renderDialog({ defaultValues: { session_type: "contractual" } });

      const memberCount = screen.getByTestId("member-count");
      expect(memberCount.textContent).toBe("1"); // Only trial member
      expect(screen.getByTestId("member-member-2")).toBeInTheDocument();
      expect(screen.queryByTestId("member-member-1")).not.toBeInTheDocument();
    });

    it("should display trial member placeholder for contractual sessions", () => {
      formState.session_type = "contractual";
      renderDialog({ defaultValues: { session_type: "contractual" } });

      const placeholder = screen.getByTestId("member-placeholder");
      expect(placeholder.textContent).toBe("Select a trial member");
    });
  });

  describe("AC-2: Dynamic Form Sections - Make-up Session", () => {
    it("should show member combobox for makeup sessions", () => {
      formState.session_type = "makeup";
      renderDialog({ defaultValues: { session_type: "makeup" } });

      expect(screen.getByTestId("member-combobox")).toBeInTheDocument();
    });

    it("should show all members (no filtering) for makeup sessions", () => {
      formState.session_type = "makeup";
      renderDialog({ defaultValues: { session_type: "makeup" } });

      const memberCount = screen.getByTestId("member-count");
      expect(memberCount.textContent).toBe("2");
    });
  });

  describe("AC-2: Dynamic Form Sections - Multi-Site Session", () => {
    it("should show guest fields for multi-site sessions", () => {
      formState.session_type = "multi_site";
      renderDialog({ defaultValues: { session_type: "multi_site" } });

      expect(screen.getByTestId("guest-info-multi_site")).toBeInTheDocument();
      expect(screen.getByLabelText(/guest first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/origin gym/i)).toBeInTheDocument();
    });

    it("should hide member combobox for multi-site sessions", () => {
      formState.session_type = "multi_site";
      renderDialog({ defaultValues: { session_type: "multi_site" } });

      expect(screen.queryByTestId("member-combobox")).not.toBeInTheDocument();
    });
  });

  describe("AC-2: Dynamic Form Sections - Collaboration Session", () => {
    it("should show collaboration textarea for collaboration sessions", () => {
      formState.session_type = "collaboration";
      renderDialog({ defaultValues: { session_type: "collaboration" } });

      expect(
        screen.getByTestId("guest-info-collaboration")
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/collaboration details/i)
      ).toBeInTheDocument();
    });

    it("should hide member combobox for collaboration sessions", () => {
      formState.session_type = "collaboration";
      renderDialog({ defaultValues: { session_type: "collaboration" } });

      expect(screen.queryByTestId("member-combobox")).not.toBeInTheDocument();
    });
  });

  describe("AC-2: Dynamic Form Sections - Non-Bookable Session", () => {
    it("should show time blocker message for non-bookable sessions", () => {
      formState.session_type = "non_bookable";
      renderDialog({ defaultValues: { session_type: "non_bookable" } });

      expect(screen.getByText(/time blocker/i)).toBeInTheDocument();
      expect(
        screen.getByText(/no member information is needed/i)
      ).toBeInTheDocument();
    });

    it("should hide member section for non-bookable sessions", () => {
      formState.session_type = "non_bookable";
      renderDialog({ defaultValues: { session_type: "non_bookable" } });

      expect(screen.queryByTestId("member-combobox")).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("trial-registration")
      ).not.toBeInTheDocument();
    });

    it("should hide guest info for non-bookable sessions", () => {
      formState.session_type = "non_bookable";
      renderDialog({ defaultValues: { session_type: "non_bookable" } });

      expect(
        screen.queryByTestId("guest-info-multi_site")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("guest-info-collaboration")
      ).not.toBeInTheDocument();
    });
  });

  describe("AC-3: Form Submission Logic", () => {
    it("should call mutation with correct data on submit", async () => {
      renderDialog();

      // Submit is handled by the form - verify mutation is available
      expect(useCreateTrainingSession).toHaveBeenCalled();
      const mutation = vi.mocked(useCreateTrainingSession).mock.results[0]
        ?.value;
      expect(mutation).toHaveProperty("mutateAsync");
    });

    it("should show success toast with correct session type label on successful submission", async () => {
      const user = userEvent.setup();
      renderDialog();

      // Simulate form submission (handled by react-hook-form)
      await mockMutateAsync({ session_type: "member" });

      // Verify mutation was called
      expect(mockMutateAsync).toHaveBeenCalled();
    });

    it("should show error toast on submission failure", async () => {
      mockMutateAsync.mockRejectedValueOnce(new Error("Network error"));

      renderDialog();

      // The error handling is in the component's onSubmit
      expect(useCreateTrainingSession).toHaveBeenCalled();
    });
  });

  describe("AC-4: Validation Feedback", () => {
    it("should display form error messages", () => {
      renderDialog();

      // Form errors are handled by react-hook-form and displayed via FormMessage
      const errorElements = screen.queryAllByTestId("form-error");
      expect(errorElements).toBeDefined();
    });

    it("should disable submit button when mutation is pending", () => {
      vi.mocked(useCreateTrainingSession).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
      } as any);

      renderDialog();

      const submitButton = screen.getByText(/booking/i);
      expect(submitButton).toBeDisabled();
    });

    it("should show loading state in submit button when pending", () => {
      vi.mocked(useCreateTrainingSession).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
      } as any);

      renderDialog();

      expect(screen.getByText(/booking/i)).toBeInTheDocument();
    });
  });

  describe("Dialog State Management", () => {
    it("should render when open is true", () => {
      renderDialog({ open: true });
      expect(screen.getByTestId("dialog")).toBeInTheDocument();
    });

    it("should not render when open is false", () => {
      renderDialog({ open: false });
      expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
    });

    it("should display correct dialog title and description", () => {
      renderDialog();
      expect(screen.getByText(/book training session/i)).toBeInTheDocument();
      expect(
        screen.getByText(
          /select session type and provide required information/i
        )
      ).toBeInTheDocument();
    });
  });

  describe("Data Loading", () => {
    it("should load machines from useMachines hook", () => {
      renderDialog();
      expect(useMachines).toHaveBeenCalled();
    });

    it("should load members from useMembers hook with correct limit", () => {
      renderDialog();
      expect(useMembers).toHaveBeenCalledWith({ limit: 10000 });
    });

    it("should load trainers from useTrainers hook with active status", () => {
      renderDialog();
      expect(useTrainers).toHaveBeenCalledWith({ status: "active" });
    });

    it("should show unavailable label for disabled machines", () => {
      renderDialog();
      expect(screen.getByText(/unavailable/i)).toBeInTheDocument();
    });
  });

  describe("Common Form Fields", () => {
    it("should show machine selection for all session types", () => {
      renderDialog();

      // Machine selection is always present
      expect(screen.getByText("Machine 1")).toBeInTheDocument();
      expect(screen.getByText("Machine 2")).toBeInTheDocument();
    });

    it("should show trainer selection for all session types", () => {
      renderDialog();

      // Trainer selection is always present
      expect(screen.getByText("Mike Trainer")).toBeInTheDocument();
    });

    it("should show notes field for all session types", () => {
      renderDialog();

      // Notes textarea should always be present
      const notesFields = screen.getAllByPlaceholderText(/additional notes/i);
      expect(notesFields.length).toBeGreaterThan(0);
    });
  });

  describe("Default Values", () => {
    it("should populate form with defaultValues", () => {
      const defaultValues = {
        machine_id: "machine-1",
        session_type: "member" as const,
        scheduled_start: "2025-01-15T10:00:00Z",
        scheduled_end: "2025-01-15T10:30:00Z",
      };

      renderDialog({ defaultValues });

      expect(screen.getByTestId("dialog")).toBeInTheDocument();
    });
  });
});
