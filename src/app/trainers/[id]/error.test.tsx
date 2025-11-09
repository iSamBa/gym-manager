import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter } from "next/navigation";
import TrainerError from "./error";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe("TrainerError", () => {
  const mockReset = vi.fn();
  const mockPush = vi.fn();
  const mockError = new Error("Test error message");

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
    } as ReturnType<typeof useRouter>);
  });

  it("renders error message", () => {
    render(<TrainerError error={mockError} reset={mockReset} />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(
      screen.getByText(
        "We encountered an error while loading trainer information"
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });

  it("renders error digest when provided", () => {
    const errorWithDigest = Object.assign(mockError, {
      digest: "xyz789",
    });

    render(<TrainerError error={errorWithDigest} reset={mockReset} />);

    expect(screen.getByText(/Error ID: xyz789/)).toBeInTheDocument();
  });

  it("handles retry action", () => {
    render(<TrainerError error={mockError} reset={mockReset} />);

    const retryButton = screen.getByRole("button", { name: /try again/i });
    fireEvent.click(retryButton);

    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it("handles back to trainers list action", () => {
    render(<TrainerError error={mockError} reset={mockReset} />);

    const backButton = screen.getByRole("button", {
      name: /back to trainers/i,
    });
    fireEvent.click(backButton);

    expect(mockPush).toHaveBeenCalledWith("/trainers");
  });

  it("handles go home action", () => {
    render(<TrainerError error={mockError} reset={mockReset} />);

    const homeButton = screen.getByRole("button", { name: /go home/i });
    fireEvent.click(homeButton);

    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("displays fallback message for errors without message", () => {
    const errorWithoutMessage = new Error();
    errorWithoutMessage.message = "";

    render(<TrainerError error={errorWithoutMessage} reset={mockReset} />);

    expect(
      screen.getByText("An unexpected error occurred")
    ).toBeInTheDocument();
  });

  it("renders all recovery action buttons", () => {
    render(<TrainerError error={mockError} reset={mockReset} />);

    expect(
      screen.getByRole("button", { name: /try again/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /back to trainers/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /go home/i })
    ).toBeInTheDocument();
  });
});
