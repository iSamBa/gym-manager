import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { vi } from "vitest";
import { Sidebar } from "../sidebar";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

describe("Sidebar", () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue("/");
  });

  it("renders admin navigation items", () => {
    render(<Sidebar />);

    expect(screen.getByText("Plans")).toBeInTheDocument();
    expect(screen.getByText("Subscriptions")).toBeInTheDocument();
    expect(screen.getByText("Payments")).toBeInTheDocument();
  });

  it("highlights active route", () => {
    vi.mocked(usePathname).mockReturnValue("/plans");
    render(<Sidebar />);

    const plansLink = screen.getByText("Plans").closest("a");
    expect(plansLink).toHaveClass("bg-secondary");
  });
});
