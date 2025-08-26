import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  MemberErrorBoundary,
  withMemberErrorBoundary,
} from "../MemberErrorBoundary";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

// Test component that throws an error
const ThrowErrorComponent = ({
  shouldThrow = false,
}: {
  shouldThrow?: boolean;
}) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>Working component</div>;
};

describe("MemberErrorBoundary", () => {
  it("renders children when no error occurs", () => {
    render(
      <MemberErrorBoundary>
        <ThrowErrorComponent />
      </MemberErrorBoundary>
    );

    expect(screen.getByText("Working component")).toBeInTheDocument();
  });

  it("catches errors and shows fallback UI", () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <MemberErrorBoundary>
        <ThrowErrorComponent shouldThrow />
      </MemberErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Try Again")).toBeInTheDocument();
    expect(screen.getByText("Refresh Page")).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it("shows custom fallback when provided", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const customFallback = <div>Custom error UI</div>;

    render(
      <MemberErrorBoundary fallback={customFallback}>
        <ThrowErrorComponent shouldThrow />
      </MemberErrorBoundary>
    );

    expect(screen.getByText("Custom error UI")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it("calls onError callback when error occurs", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const handleError = vi.fn();

    render(
      <MemberErrorBoundary onError={handleError}>
        <ThrowErrorComponent shouldThrow />
      </MemberErrorBoundary>
    );

    expect(handleError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );

    consoleSpy.mockRestore();
  });

  it("recovers after retry button click", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);
      return (
        <MemberErrorBoundary>
          <button onClick={() => setShouldThrow(false)}>Fix</button>
          <ThrowErrorComponent shouldThrow={shouldThrow} />
        </MemberErrorBoundary>
      );
    };

    render(<TestComponent />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Try Again"));
    // Component should attempt to re-render

    consoleSpy.mockRestore();
  });
});

describe("withMemberErrorBoundary HOC", () => {
  it("wraps component with error boundary", () => {
    const TestComponent = () => <div>Test component</div>;
    const WrappedComponent = withMemberErrorBoundary(TestComponent);

    render(<WrappedComponent />);
    expect(screen.getByText("Test component")).toBeInTheDocument();
  });

  it("catches errors in wrapped component", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const ErrorComponent = () => {
      throw new Error("Wrapped error");
    };
    const WrappedComponent = withMemberErrorBoundary(ErrorComponent);

    render(<WrappedComponent />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
