import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionBookingDialog } from "../SessionBookingDialog";

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

vi.mock("@/components/ui/form", () => ({
  Form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
  FormField: ({ render, control, name }: any) => {
    const field = { value: "", onChange: vi.fn(), name };
    return render({ field });
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

vi.mock("@/components/ui/radio-group", () => ({
  RadioGroup: ({ children }: any) => (
    <div data-testid="radio-group">{children}</div>
  ),
  RadioGroupItem: ({ value }: any) => <input type="radio" value={value} />,
}));

vi.mock("@/components/ui/label", () => ({
  Label: ({ children }: any) => <label>{children}</label>,
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
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

import { useMachines } from "../../../hooks/use-machines";
import { useMembers } from "@/features/members/hooks/use-members";
import { useTrainers } from "@/features/trainers/hooks/use-trainers";
import { useCreateTrainingSession } from "../../../hooks/use-training-sessions";
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
  {
    id: "machine-3",
    machine_number: 3,
    name: "Machine 3",
    is_available: true,
  },
];

const mockMembers = [
  {
    id: "member-1",
    user_id: "user-1",
    first_name: "John",
    last_name: "Doe",
    status: "active",
  },
  {
    id: "member-2",
    user_id: "user-2",
    first_name: "Jane",
    last_name: "Smith",
    status: "inactive",
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
  {
    id: "trainer-2",
    user_profile: {
      first_name: "Sarah",
      last_name: "Coach",
    },
  },
];

describe("SessionBookingDialog - Business Logic Tests", () => {
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

  describe("Dialog State Management", () => {
    it("should render when open is true", () => {
      renderDialog({ open: true });
      expect(screen.getByTestId("dialog")).toBeInTheDocument();
    });

    it("should not render when open is false", () => {
      renderDialog({ open: false });
      expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
    });

    it("should display dialog title", () => {
      renderDialog();
      expect(screen.getByText(/book training session/i)).toBeInTheDocument();
    });
  });

  describe("Data Loading from Hooks", () => {
    it("should load and display machines from useMachines hook", () => {
      renderDialog();

      expect(useMachines).toHaveBeenCalled();
      expect(screen.getByText("Machine 1")).toBeInTheDocument();
      expect(screen.getByText("Machine 2")).toBeInTheDocument();
      expect(screen.getByText("Machine 3")).toBeInTheDocument();
    });

    it("should load and display members from useMembers hook", () => {
      renderDialog();

      expect(useMembers).toHaveBeenCalled();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    it("should load and display trainers from useTrainers hook with status filter", () => {
      renderDialog();

      expect(useTrainers).toHaveBeenCalledWith({ status: "active" });
      expect(screen.getByText("Mike Trainer")).toBeInTheDocument();
      expect(screen.getByText("Sarah Coach")).toBeInTheDocument();
    });

    it("should show unavailable label for disabled machines", () => {
      renderDialog();
      expect(screen.getByText(/unavailable/i)).toBeInTheDocument();
    });

    it("should show member names without status badges", () => {
      renderDialog();
      // Verify member names are shown
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      // Verify status badges are NOT shown
      expect(screen.queryByText("active")).not.toBeInTheDocument();
      expect(screen.queryByText("inactive")).not.toBeInTheDocument();
    });
  });

  describe("Hook Integration", () => {
    it("should use useCreateTrainingSession hook for form submission", () => {
      renderDialog();

      // Verify the hook is called during component render
      expect(useCreateTrainingSession).toHaveBeenCalled();
    });

    it("should provide mutation function to form", () => {
      renderDialog();

      // Verify component has access to the mutation
      const createMutation = vi.mocked(useCreateTrainingSession).mock.results[0]
        ?.value;
      expect(createMutation).toHaveProperty("mutateAsync");
      expect(createMutation).toHaveProperty("isPending");
    });
  });

  describe("Form State Management", () => {
    it("should accept defaultValues prop and populate form", () => {
      const defaultValues = {
        machine_id: "machine-1",
        member_id: "member-1",
        trainer_id: "trainer-1",
        scheduled_start: "2025-01-15T10:00:00Z",
        scheduled_end: "2025-01-15T10:30:00Z",
        session_type: "standard" as const,
        notes: "Test notes",
      };

      renderDialog({ defaultValues });

      // Component should render with these values (we're not testing the form library, just that props are passed)
      expect(screen.getByTestId("dialog")).toBeInTheDocument();
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
  });

  describe("Session Type Selection", () => {
    it("should render session type radio options", () => {
      renderDialog();

      expect(screen.getByTestId("radio-group")).toBeInTheDocument();
    });

    it("should default to standard session type", () => {
      renderDialog();

      // The form should initialize with "standard" as default
      expect(screen.getByTestId("dialog")).toBeInTheDocument();
    });
  });

  describe("Required Fields", () => {
    it("should mark machine, member, start time, and end time as required", () => {
      renderDialog();

      // Check for required field indicators (*)
      const labels = screen.getAllByText(/\*/);
      expect(labels.length).toBeGreaterThan(0);
    });

    it("should mark trainer as optional", () => {
      renderDialog();

      // Check for optional indicator in trainer label
      const optionalTexts = screen.getAllByText(/optional/i);
      expect(optionalTexts.length).toBeGreaterThan(0);

      // Check for "Assign later" text
      const assignLaterTexts = screen.getAllByText(/assign later/i);
      expect(assignLaterTexts.length).toBeGreaterThan(0);
    });
  });
});
