import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TrainerAvailabilityCheck } from "../../components/forms/TrainerAvailabilityCheck";

// Mock the hook
vi.mock("../../hooks/use-trainer-availability", () => ({
  useTrainerAvailability: vi.fn(),
}));

// Mock date-fns format function
vi.mock("date-fns", () => ({
  format: vi.fn(() => "Dec 1, 9:00 AM"),
}));

import { useTrainerAvailability } from "../../hooks/use-trainer-availability";

describe("TrainerAvailabilityCheck", () => {
  let queryClient: QueryClient;

  const defaultProps = {
    trainerId: "trainer-123",
    startTime: "2024-12-01T09:00:00.000Z",
    endTime: "2024-12-01T10:00:00.000Z",
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderWithQueryClient = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    );
  };

  describe("Basic Functionality", () => {
    it("should show loading state", () => {
      (useTrainerAvailability as any).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      renderWithQueryClient(<TrainerAvailabilityCheck {...defaultProps} />);

      expect(
        screen.getByText("Checking trainer availability...")
      ).toBeInTheDocument();
    });

    it("should handle empty availability data", () => {
      (useTrainerAvailability as any).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { container } = renderWithQueryClient(
        <TrainerAvailabilityCheck {...defaultProps} />
      );

      expect(container.firstChild).toBeNull();
    });

    it("should render with valid data", () => {
      (useTrainerAvailability as any).mockReturnValue({
        data: { is_available: true },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { container } = renderWithQueryClient(
        <TrainerAvailabilityCheck {...defaultProps} />
      );

      expect(container.firstChild).not.toBeNull();
    });
  });
});
