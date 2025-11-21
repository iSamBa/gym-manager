import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppErrorBoundary } from "../AppErrorBoundary";
import { logger } from "@/lib/logger";

// Mock the logger
vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

// Component that throws an error
const ThrowError = ({ message = "Test error" }: { message?: string }) => {
  throw new Error(message);
};

// Component that works
const WorkingComponent = () => <div>Success!</div>;

describe("AppErrorBoundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console errors in tests
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("Error Catching", () => {
    it("should catch errors and display fallback UI", () => {
      render(
        <AppErrorBoundary feature="test">
          <ThrowError />
        </AppErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText(/test section/i)).toBeInTheDocument();
    });

    it("should display feature name in error message", () => {
      render(
        <AppErrorBoundary feature="payments">
          <ThrowError />
        </AppErrorBoundary>
      );

      expect(screen.getByText(/payments section/i)).toBeInTheDocument();
    });

    it("should log error with feature context", () => {
      render(
        <AppErrorBoundary feature="members">
          <ThrowError message="Member load failed" />
        </AppErrorBoundary>
      );

      expect(logger.error).toHaveBeenCalledWith(
        "Error in members feature",
        expect.objectContaining({
          error: "Member load failed",
          feature: "members",
          stack: expect.any(String),
          componentStack: expect.any(String),
        })
      );
    });
  });

  describe("Custom Error Handler", () => {
    it("should call onError callback when error occurs", () => {
      const onError = vi.fn();

      render(
        <AppErrorBoundary feature="test" onError={onError}>
          <ThrowError message="Custom error" />
        </AppErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Custom error",
        }),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it("should work without onError callback", () => {
      expect(() => {
        render(
          <AppErrorBoundary feature="test">
            <ThrowError />
          </AppErrorBoundary>
        );
      }).not.toThrow();
    });
  });

  describe("Custom Fallback", () => {
    it("should render custom fallback when provided", () => {
      const CustomFallback = <div>Custom Error UI</div>;

      render(
        <AppErrorBoundary feature="test" fallback={CustomFallback}>
          <ThrowError />
        </AppErrorBoundary>
      );

      expect(screen.getByText("Custom Error UI")).toBeInTheDocument();
      expect(
        screen.queryByText(/Something went wrong/i)
      ).not.toBeInTheDocument();
    });
  });

  describe("Recovery Actions", () => {
    it("should display Try Again button", () => {
      render(
        <AppErrorBoundary feature="test">
          <ThrowError />
        </AppErrorBoundary>
      );

      expect(
        screen.getByRole("button", { name: /try again/i })
      ).toBeInTheDocument();
    });

    it("should display Go Back button", () => {
      render(
        <AppErrorBoundary feature="test">
          <ThrowError />
        </AppErrorBoundary>
      );

      expect(
        screen.getByRole("button", { name: /go back/i })
      ).toBeInTheDocument();
    });

    it("should display Contact Support button", () => {
      render(
        <AppErrorBoundary feature="test">
          <ThrowError />
        </AppErrorBoundary>
      );

      expect(
        screen.getByRole("button", { name: /contact support/i })
      ).toBeInTheDocument();
    });

    it("should reset error state when Try Again is clicked", async () => {
      let shouldThrow = true;
      const ConditionalError = () => {
        if (shouldThrow) throw new Error("Test error");
        return <div>Success!</div>;
      };

      const { rerender } = render(
        <AppErrorBoundary feature="test">
          <ConditionalError />
        </AppErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();

      // Fix the error condition
      shouldThrow = false;

      // Click Try Again
      const tryAgainButton = screen.getByRole("button", { name: /try again/i });
      fireEvent.click(tryAgainButton);

      // Rerender with fixed component
      rerender(
        <AppErrorBoundary feature="test">
          <ConditionalError />
        </AppErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText("Success!")).toBeInTheDocument();
      });
    });

    it("should call window.history.back when Go Back is clicked", () => {
      const mockBack = vi.fn();
      window.history.back = mockBack;

      render(
        <AppErrorBoundary feature="test">
          <ThrowError />
        </AppErrorBoundary>
      );

      const goBackButton = screen.getByRole("button", { name: /go back/i });
      fireEvent.click(goBackButton);

      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe("Development Mode", () => {
    it("should show error details in development mode", () => {
      // Use vi.stubEnv to mock NODE_ENV
      vi.stubEnv("NODE_ENV", "development");

      render(
        <AppErrorBoundary feature="test">
          <ThrowError message="Detailed error message" />
        </AppErrorBoundary>
      );

      expect(screen.getByText("Error Details:")).toBeInTheDocument();
      expect(screen.getByText("Detailed error message")).toBeInTheDocument();

      vi.unstubAllEnvs();
    });

    it("should hide error details in production mode", async () => {
      // Stub environment and reset modules to clear cached env
      vi.stubEnv("NODE_ENV", "production");
      vi.resetModules();

      // Dynamically import to get fresh env module
      const { AppErrorBoundary: FreshBoundary } = await import(
        "../AppErrorBoundary"
      );

      render(
        <FreshBoundary feature="test">
          <ThrowError message="Production error" />
        </FreshBoundary>
      );

      expect(screen.queryByText("Error Details:")).not.toBeInTheDocument();
      expect(screen.queryByText("Production error")).not.toBeInTheDocument();

      vi.unstubAllEnvs();
      vi.resetModules();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes", () => {
      render(
        <AppErrorBoundary feature="test">
          <ThrowError />
        </AppErrorBoundary>
      );

      const errorContainer = screen.getByRole("alert");
      expect(errorContainer).toHaveAttribute("aria-live", "assertive");
    });

    it("should have accessible button labels", () => {
      render(
        <AppErrorBoundary feature="test">
          <ThrowError />
        </AppErrorBoundary>
      );

      expect(
        screen.getByRole("button", { name: /try again/i })
      ).toHaveAccessibleName();
      expect(
        screen.getByRole("button", { name: /go back to previous page/i })
      ).toHaveAccessibleName();
      expect(
        screen.getByRole("button", { name: /contact support via email/i })
      ).toHaveAccessibleName();
    });

    it("should have aria-hidden on decorative icons", () => {
      const { container } = render(
        <AppErrorBoundary feature="test">
          <ThrowError />
        </AppErrorBoundary>
      );

      // Check that icons have aria-hidden attribute
      const iconsWithAriaHidden = container.querySelectorAll(
        '[aria-hidden="true"]'
      );
      expect(iconsWithAriaHidden.length).toBeGreaterThan(0);
    });
  });

  describe("Normal Operation", () => {
    it("should render children when no error occurs", () => {
      render(
        <AppErrorBoundary feature="test">
          <WorkingComponent />
        </AppErrorBoundary>
      );

      expect(screen.getByText("Success!")).toBeInTheDocument();
      expect(
        screen.queryByText(/Something went wrong/i)
      ).not.toBeInTheDocument();
    });

    it("should not call onError when no error occurs", () => {
      const onError = vi.fn();

      render(
        <AppErrorBoundary feature="test" onError={onError}>
          <WorkingComponent />
        </AppErrorBoundary>
      );

      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe("Display Name", () => {
    it("should have correct display name for debugging", () => {
      expect(AppErrorBoundary.displayName).toBe("AppErrorBoundary");
    });
  });

  describe("Multiple Features", () => {
    it("should handle different features independently", () => {
      const { unmount: unmount1 } = render(
        <AppErrorBoundary feature="feature1">
          <ThrowError />
        </AppErrorBoundary>
      );

      expect(screen.getByText(/feature1 section/i)).toBeInTheDocument();
      unmount1();

      const { unmount: unmount2 } = render(
        <AppErrorBoundary feature="feature2">
          <ThrowError />
        </AppErrorBoundary>
      );

      expect(screen.getByText(/feature2 section/i)).toBeInTheDocument();
      unmount2();
    });
  });
});
