import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionBookingDialog } from "../SessionBookingDialog";

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

describe("SessionBookingDialog", () => {
  let queryClient: QueryClient;
  let mockOnOpenChange: ReturnType<typeof vi.fn>;
  let mockMutateAsync: ReturnType<typeof vi.fn>;

  const mockMachines = [
    {
      id: "machine-1",
      machine_number: 1 as const,
      name: "Machine 1",
      is_available: true,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    },
    {
      id: "machine-2",
      machine_number: 2 as const,
      name: "Machine 2",
      is_available: false, // Unavailable machine
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    },
    {
      id: "machine-3",
      machine_number: 3 as const,
      name: "Machine 3",
      is_available: true,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    },
  ];

  const mockMembers = [
    {
      id: "member-1",
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
      status: "active",
      phone: "123-456-7890",
      date_of_birth: "1990-01-01",
      emergency_contact_name: "Jane Doe",
      emergency_contact_phone: "098-765-4321",
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    },
    {
      id: "member-2",
      first_name: "Jane",
      last_name: "Smith",
      email: "jane@example.com",
      status: "inactive",
      phone: "111-222-3333",
      date_of_birth: "1992-01-01",
      emergency_contact_name: "John Smith",
      emergency_contact_phone: "444-555-6666",
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    },
  ];

  const mockTrainers = [
    {
      id: "trainer-1",
      user_profile: {
        first_name: "Mike",
        last_name: "Trainer",
      },
      specialization: ["strength"],
      certification_expiry: "2026-01-01",
      is_accepting_new_clients: true,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    },
    {
      id: "trainer-2",
      user_profile: {
        first_name: "Sarah",
        last_name: "Coach",
      },
      specialization: ["cardio"],
      certification_expiry: "2026-01-01",
      is_accepting_new_clients: true,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    },
  ];

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

  const renderDialog = (props: Partial<typeof defaultProps> = {}) => {
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

  // AC-1: Machine Selection Field
  describe("Machine Selection (AC-1)", () => {
    it("should display machine dropdown with all machines", async () => {
      renderDialog();

      const machineSelect = screen.getByRole("combobox", { name: /machine/i });
      expect(machineSelect).toBeInTheDocument();

      await userEvent.click(machineSelect);

      await waitFor(() => {
        expect(screen.getByText("Machine 1")).toBeInTheDocument();
        expect(screen.getByText("Machine 3")).toBeInTheDocument();
      });
    });

    it("should disable unavailable machines in dropdown", async () => {
      renderDialog();

      const machineSelect = screen.getByRole("combobox", { name: /machine/i });
      await userEvent.click(machineSelect);

      await waitFor(() => {
        const unavailableMachine = screen.getByText(/Machine 2.*Unavailable/i);
        expect(unavailableMachine).toBeInTheDocument();
      });
    });

    it("should pre-select machine when provided in defaultValues", () => {
      renderDialog({
        defaultValues: {
          machine_id: "machine-1",
        },
      });

      const machineSelect = screen.getByRole("combobox", { name: /machine/i });
      expect(machineSelect).toHaveValue("machine-1");
    });

    it("should show validation error when machine is not selected", async () => {
      const user = userEvent.setup();
      renderDialog();

      const submitButton = screen.getByRole("button", {
        name: /book session/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Machine is required")).toBeInTheDocument();
      });
    });
  });

  // AC-2: Member Selection Field
  describe("Member Selection (AC-2)", () => {
    it("should display single member dropdown (not multi-select)", async () => {
      renderDialog();

      const memberSelect = screen.getByRole("combobox", { name: /member/i });
      expect(memberSelect).toBeInTheDocument();

      await userEvent.click(memberSelect);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      });
    });

    it("should show member status badge in dropdown", async () => {
      renderDialog();

      const memberSelect = screen.getByRole("combobox", { name: /member/i });
      await userEvent.click(memberSelect);

      await waitFor(() => {
        expect(screen.getByText("active")).toBeInTheDocument();
        expect(screen.getByText("inactive")).toBeInTheDocument();
      });
    });

    it("should show validation error when member is not selected", async () => {
      const user = userEvent.setup();
      renderDialog();

      const submitButton = screen.getByRole("button", {
        name: /book session/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Member is required")).toBeInTheDocument();
      });
    });
  });

  // AC-3: Trainer Selection Field
  describe("Trainer Selection (AC-3)", () => {
    it("should display optional trainer dropdown with 'Assign Later' placeholder", async () => {
      renderDialog();

      const trainerSelect = screen.getByRole("combobox", { name: /trainer/i });
      expect(trainerSelect).toBeInTheDocument();

      await userEvent.click(trainerSelect);

      await waitFor(() => {
        expect(screen.getByText("Assign later")).toBeInTheDocument();
        expect(screen.getByText("Mike Trainer")).toBeInTheDocument();
        expect(screen.getByText("Sarah Coach")).toBeInTheDocument();
      });
    });

    it("should show helper text indicating trainer can be added later", () => {
      renderDialog();

      expect(
        screen.getByText(
          /you can assign a trainer when completing the session/i
        )
      ).toBeInTheDocument();
    });

    it("should allow form submission without selecting a trainer", async () => {
      const user = userEvent.setup();
      renderDialog({
        defaultValues: {
          machine_id: "machine-1",
          member_id: "member-1",
          scheduled_start: "2025-01-15T10:00:00Z",
          scheduled_end: "2025-01-15T10:30:00Z",
          session_type: "standard",
        },
      });

      const submitButton = screen.getByRole("button", {
        name: /book session/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            trainer_id: null,
          })
        );
      });
    });
  });

  // AC-4: Time Slot Fields
  describe("Time Slot Fields (AC-4)", () => {
    it("should pre-fill time fields from defaultValues", () => {
      renderDialog({
        defaultValues: {
          scheduled_start: "2025-01-15T10:00:00Z",
          scheduled_end: "2025-01-15T10:30:00Z",
        },
      });

      const startInput = screen.getByLabelText(
        /start time/i
      ) as HTMLInputElement;
      const endInput = screen.getByLabelText(/end time/i) as HTMLInputElement;

      expect(startInput.value).toBeTruthy();
      expect(endInput.value).toBeTruthy();
    });

    it("should auto-calculate end time (30-min duration) when start time is set", async () => {
      const user = userEvent.setup();
      renderDialog();

      const startInput = screen.getByLabelText(
        /start time/i
      ) as HTMLInputElement;

      // Simulate datetime-local input
      await user.clear(startInput);
      await user.type(startInput, "2025-01-15T10:00");

      await waitFor(() => {
        const endInput = screen.getByLabelText(/end time/i) as HTMLInputElement;
        expect(endInput.value).toBeTruthy();
      });
    });

    it("should show validation error when end time is before start time", async () => {
      const user = userEvent.setup();
      renderDialog({
        defaultValues: {
          machine_id: "machine-1",
          member_id: "member-1",
          scheduled_start: "2025-01-15T10:30:00Z",
          scheduled_end: "2025-01-15T10:00:00Z", // End before start
          session_type: "standard",
        },
      });

      const submitButton = screen.getByRole("button", {
        name: /book session/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("End time must be after start time")
        ).toBeInTheDocument();
      });
    });

    it("should display helper text for default 30-minute duration", () => {
      renderDialog();

      expect(
        screen.getByText(/default duration: 30 minutes/i)
      ).toBeInTheDocument();
    });
  });

  // AC-5: Form Behavior
  describe("Form Behavior (AC-5)", () => {
    it("should create session with single member when submitted", async () => {
      const user = userEvent.setup();
      renderDialog({
        defaultValues: {
          machine_id: "machine-1",
          member_id: "member-1",
          trainer_id: "trainer-1",
          scheduled_start: "2025-01-15T10:00:00Z",
          scheduled_end: "2025-01-15T10:30:00Z",
          session_type: "standard",
          notes: "Test session",
        },
      });

      const submitButton = screen.getByRole("button", {
        name: /book session/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          machine_id: "machine-1",
          member_id: "member-1",
          trainer_id: "trainer-1",
          scheduled_start: "2025-01-15T10:00:00Z",
          scheduled_end: "2025-01-15T10:30:00Z",
          session_type: "standard",
          notes: "Test session",
        });
      });
    });

    it("should handle optional trainer by sending null when not selected", async () => {
      const user = userEvent.setup();
      renderDialog({
        defaultValues: {
          machine_id: "machine-1",
          member_id: "member-1",
          scheduled_start: "2025-01-15T10:00:00Z",
          scheduled_end: "2025-01-15T10:30:00Z",
          session_type: "standard",
        },
      });

      const submitButton = screen.getByRole("button", {
        name: /book session/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            trainer_id: null,
          })
        );
      });
    });

    it("should show success toast on successful submission", async () => {
      const user = userEvent.setup();
      renderDialog({
        defaultValues: {
          machine_id: "machine-1",
          member_id: "member-1",
          scheduled_start: "2025-01-15T10:00:00Z",
          scheduled_end: "2025-01-15T10:30:00Z",
          session_type: "standard",
        },
      });

      const submitButton = screen.getByRole("button", {
        name: /book session/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Session booked successfully",
          expect.any(Object)
        );
      });
    });

    it("should close dialog on successful submission", async () => {
      const user = userEvent.setup();
      renderDialog({
        defaultValues: {
          machine_id: "machine-1",
          member_id: "member-1",
          scheduled_start: "2025-01-15T10:00:00Z",
          scheduled_end: "2025-01-15T10:30:00Z",
          session_type: "standard",
        },
      });

      const submitButton = screen.getByRole("button", {
        name: /book session/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it("should show error toast on submission failure", async () => {
      mockMutateAsync.mockRejectedValueOnce(
        new Error("Failed to create session")
      );

      const user = userEvent.setup();
      renderDialog({
        defaultValues: {
          machine_id: "machine-1",
          member_id: "member-1",
          scheduled_start: "2025-01-15T10:00:00Z",
          scheduled_end: "2025-01-15T10:30:00Z",
          session_type: "standard",
        },
      });

      const submitButton = screen.getByRole("button", {
        name: /book session/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Failed to book session",
          expect.objectContaining({
            description: "Failed to create session",
          })
        );
      });
    });

    it("should show validation errors clearly for all required fields", async () => {
      const user = userEvent.setup();
      renderDialog();

      const submitButton = screen.getByRole("button", {
        name: /book session/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Machine is required")).toBeInTheDocument();
        expect(screen.getByText("Member is required")).toBeInTheDocument();
        expect(screen.getByText("Start time is required")).toBeInTheDocument();
        expect(screen.getByText("End time is required")).toBeInTheDocument();
      });
    });

    it("should disable submit button while submitting", () => {
      vi.mocked(useCreateTrainingSession).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
      } as any);

      renderDialog();

      const submitButton = screen.getByRole("button", { name: /booking/i });
      expect(submitButton).toBeDisabled();
    });
  });

  // Additional Tests
  describe("Session Type Selection", () => {
    it("should allow selecting trail or standard session type", async () => {
      const user = userEvent.setup();
      renderDialog();

      const trailRadio = screen.getByLabelText(/trail session/i);
      const standardRadio = screen.getByLabelText(/standard session/i);

      expect(trailRadio).toBeInTheDocument();
      expect(standardRadio).toBeInTheDocument();

      await user.click(trailRadio);
      expect(trailRadio).toBeChecked();

      await user.click(standardRadio);
      expect(standardRadio).toBeChecked();
    });

    it("should default to standard session type", () => {
      renderDialog();

      const standardRadio = screen.getByLabelText(/standard session/i);
      expect(standardRadio).toBeChecked();
    });
  });

  describe("Notes Field", () => {
    it("should allow entering optional notes", async () => {
      const user = userEvent.setup();
      renderDialog();

      const notesTextarea =
        screen.getByPlaceholderText(/any additional notes/i);
      await user.type(notesTextarea, "This is a test note");

      expect(notesTextarea).toHaveValue("This is a test note");
    });
  });

  describe("Dialog Controls", () => {
    it("should close dialog when cancel button is clicked", async () => {
      const user = userEvent.setup();
      renderDialog();

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it("should not close dialog while submission is pending", () => {
      vi.mocked(useCreateTrainingSession).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
      } as any);

      renderDialog();

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      expect(cancelButton).toBeDisabled();
    });
  });
});
