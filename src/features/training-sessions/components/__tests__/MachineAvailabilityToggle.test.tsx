import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import { MachineAvailabilityToggle } from "../MachineAvailabilityToggle";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateMachine } from "../../hooks/use-machines";
import type { Machine } from "../../lib/types";

// Mock dependencies
vi.mock("@/hooks/use-auth");
vi.mock("../../hooks/use-machines");
vi.mock("sonner");

// Mock machine data
const mockMachine: Machine = {
  id: "machine-1",
  machine_number: 1,
  name: "Machine 1",
  is_available: true,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

const mockUnavailableMachine: Machine = {
  ...mockMachine,
  is_available: false,
};

describe("MachineAvailabilityToggle", () => {
  let queryClient: QueryClient;
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Default mock for useUpdateMachine
    vi.mocked(useUpdateMachine).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any);
  });

  const renderComponent = (machine: Machine) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MachineAvailabilityToggle machine={machine} />
      </QueryClientProvider>
    );
  };

  describe("AC-1: Admin Toggle Control - Visibility", () => {
    it("should be visible only to admin users", () => {
      // Non-admin user
      vi.mocked(useAuth).mockReturnValue({
        user: { id: "user-1", email: "user@gym.com", role: "member" },
        isAuthenticated: true,
      } as any);

      const { container } = renderComponent(mockMachine);
      expect(container.firstChild).toBeNull();
      expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    });

    it("should be visible to admin users", () => {
      // Admin user
      vi.mocked(useAuth).mockReturnValue({
        user: { id: "admin-1", email: "admin@gym.com", role: "admin" },
        isAuthenticated: true,
      } as any);

      renderComponent(mockMachine);
      expect(screen.getByRole("switch")).toBeInTheDocument();
    });

    it("should not be visible when user is null", () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
      } as any);

      const { container } = renderComponent(mockMachine);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("AC-1: Admin Toggle Control - Toggle Functionality", () => {
    beforeEach(() => {
      // Set admin user for these tests
      vi.mocked(useAuth).mockReturnValue({
        user: { id: "admin-1", email: "admin@gym.com", role: "admin" },
        isAuthenticated: true,
      } as any);
    });

    it("should display 'Available' label when machine is available", () => {
      renderComponent(mockMachine);
      expect(screen.getByText("Available")).toBeInTheDocument();
    });

    it("should display 'Disabled' label when machine is unavailable", () => {
      renderComponent(mockUnavailableMachine);
      expect(screen.getByText("Disabled")).toBeInTheDocument();
    });

    it("should toggle machine availability from enabled to disabled", async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockResolvedValue(mockUnavailableMachine);

      renderComponent(mockMachine);

      const toggle = screen.getByRole("switch");
      expect(toggle).toBeChecked(); // Initially available

      await user.click(toggle);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          id: mockMachine.id,
          data: { is_available: false },
        });
      });
    });

    it("should toggle machine availability from disabled to enabled", async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockResolvedValue(mockMachine);

      renderComponent(mockUnavailableMachine);

      const toggle = screen.getByRole("switch");
      expect(toggle).not.toBeChecked(); // Initially unavailable

      await user.click(toggle);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          id: mockUnavailableMachine.id,
          data: { is_available: true },
        });
      });
    });

    it("should be disabled during pending state", () => {
      vi.mocked(useUpdateMachine).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
      } as any);

      renderComponent(mockMachine);

      const toggle = screen.getByRole("switch");
      expect(toggle).toBeDisabled();
    });
  });

  describe("AC-1: Admin Toggle Control - Toast Notifications", () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        user: { id: "admin-1", email: "admin@gym.com", role: "admin" },
        isAuthenticated: true,
      } as any);
    });

    it("should show success toast when disabling machine", async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockResolvedValue(mockUnavailableMachine);

      renderComponent(mockMachine);

      await user.click(screen.getByRole("switch"));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Machine 1 disabled for bookings"
        );
      });
    });

    it("should show success toast when enabling machine", async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockResolvedValue(mockMachine);

      renderComponent(mockUnavailableMachine);

      await user.click(screen.getByRole("switch"));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Machine 1 enabled for bookings"
        );
      });
    });

    it("should show error toast on failure", async () => {
      const user = userEvent.setup();
      const errorMessage = "Network error";
      mockMutateAsync.mockRejectedValue(new Error(errorMessage));

      renderComponent(mockMachine);

      await user.click(screen.getByRole("switch"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Failed to update machine availability",
          {
            description: errorMessage,
          }
        );
      });
    });

    it("should show generic error message for non-Error failures", async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockRejectedValue("Unknown error");

      renderComponent(mockMachine);

      await user.click(screen.getByRole("switch"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Failed to update machine availability",
          {
            description: "An unexpected error occurred.",
          }
        );
      });
    });
  });

  describe("AC-1: Admin Toggle Control - Tooltip (Rendered)", () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        user: { id: "admin-1", email: "admin@gym.com", role: "admin" },
        isAuthenticated: true,
      } as any);
    });

    it("should render tooltip trigger for available machine", () => {
      renderComponent(mockMachine);
      // Verify tooltip component is rendered (trigger exists)
      expect(screen.getByRole("switch")).toBeInTheDocument();
    });

    it("should render tooltip trigger for unavailable machine", () => {
      renderComponent(mockUnavailableMachine);
      // Verify tooltip component is rendered (trigger exists)
      expect(screen.getByRole("switch")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        user: { id: "admin-1", email: "admin@gym.com", role: "admin" },
        isAuthenticated: true,
      } as any);
    });

    it("should have proper aria-label for available machine", () => {
      renderComponent(mockMachine);
      const toggle = screen.getByRole("switch");
      expect(toggle).toHaveAttribute(
        "aria-label",
        "Disable Machine 1 for bookings"
      );
    });

    it("should have proper aria-label for unavailable machine", () => {
      renderComponent(mockUnavailableMachine);
      const toggle = screen.getByRole("switch");
      expect(toggle).toHaveAttribute(
        "aria-label",
        "Enable Machine 1 for bookings"
      );
    });
  });
});
