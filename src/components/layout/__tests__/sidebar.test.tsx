import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { vi } from "vitest";
import { Sidebar } from "../sidebar";
import { ThemeProvider } from "@/components/providers/theme-provider";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  })),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: vi.fn(() => ({
    user: { email: "test@example.com", first_name: "Test", last_name: "User" },
    signOut: vi.fn(),
    isLoading: false,
  })),
}));

describe("Sidebar", () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue("/");
  });

  const renderWithTheme = (component: React.ReactElement) => {
    return render(<ThemeProvider>{component}</ThemeProvider>);
  };

  it("renders admin navigation items", () => {
    renderWithTheme(<Sidebar />);

    expect(screen.getByText("Plans")).toBeInTheDocument();
    expect(screen.getByText("Subscriptions")).toBeInTheDocument();
    expect(screen.getByText("Payments")).toBeInTheDocument();
  });

  it("highlights active route", () => {
    vi.mocked(usePathname).mockReturnValue("/plans");
    renderWithTheme(<Sidebar />);

    const plansLink = screen.getByText("Plans").closest("a");
    expect(plansLink).toHaveClass("bg-secondary");
  });
});
