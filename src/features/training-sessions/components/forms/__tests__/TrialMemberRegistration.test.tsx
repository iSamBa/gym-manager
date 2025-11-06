import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { TrialMemberRegistration } from "../TrialMemberRegistration";
import type { CreateSessionData } from "../../../lib/types";

// Mock shadcn/ui components to test business logic
vi.mock("@/components/ui/form", () => ({
  FormField: ({ render, name }: any) => {
    const field = { value: "", onChange: vi.fn(), name };
    return render({ field });
  },
  FormItem: ({ children }: any) => <div className="form-item">{children}</div>,
  FormLabel: ({ children }: any) => <label>{children}</label>,
  FormControl: ({ children }: any) => <div>{children}</div>,
  FormMessage: () => <span data-testid="form-error"></span>,
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: any) => <input {...props} />,
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children, onValueChange, value }: any) => (
    <div data-testid="select" data-value={value}>
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: any) => <button>{children}</button>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <div data-value={value}>{children}</div>
  ),
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

// Test wrapper component that creates a form
function TestWrapper({ children }: { children: React.ReactNode }) {
  const form = useForm<CreateSessionData>({
    defaultValues: {
      machine_id: "",
      scheduled_start: "",
      scheduled_end: "",
      session_type: "trial",
    },
  });

  return <TrialMemberRegistration form={form} />;
}

describe("TrialMemberRegistration", () => {
  // Test 1: Renders all 6 required fields
  it("renders all 6 required fields", () => {
    render(<TestWrapper>{}</TestWrapper>);

    expect(screen.getByText("First Name *")).toBeInTheDocument();
    expect(screen.getByText("Last Name *")).toBeInTheDocument();
    expect(screen.getByText("Phone *")).toBeInTheDocument();
    expect(screen.getByText("Email *")).toBeInTheDocument();
    expect(screen.getByText("Gender *")).toBeInTheDocument();
    expect(screen.getByText("Referral Source *")).toBeInTheDocument();
  });

  // Test 2: Shows correct labels with asterisks
  it("shows correct labels with required asterisks", () => {
    render(<TestWrapper>{}</TestWrapper>);

    expect(screen.getByText("First Name *")).toBeInTheDocument();
    expect(screen.getByText("Last Name *")).toBeInTheDocument();
    expect(screen.getByText("Phone *")).toBeInTheDocument();
    expect(screen.getByText("Email *")).toBeInTheDocument();
    expect(screen.getByText("Gender *")).toBeInTheDocument();
    expect(screen.getByText("Referral Source *")).toBeInTheDocument();
  });

  // Test 3: Shows section heading
  it("shows section heading for trial member registration", () => {
    render(<TestWrapper>{}</TestWrapper>);

    expect(
      screen.getByText("New Trial Member Registration")
    ).toBeInTheDocument();
  });

  // Test 4: Input field types are correct
  it("renders input fields with correct types", () => {
    render(<TestWrapper>{}</TestWrapper>);

    const phoneInput = screen.getByPlaceholderText(
      "+1 234 567 8900"
    ) as HTMLInputElement;
    const emailInput = screen.getByPlaceholderText(
      "john.doe@example.com"
    ) as HTMLInputElement;

    expect(phoneInput?.type).toBe("tel");
    expect(emailInput?.type).toBe("email");
  });

  // Test 5: Shows correct placeholders
  it("shows correct placeholders for all text inputs", () => {
    render(<TestWrapper>{}</TestWrapper>);

    expect(screen.getByPlaceholderText("John")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Doe")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("+1 234 567 8900")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("john.doe@example.com")
    ).toBeInTheDocument();
  });

  // Test 6: Gender select has correct options
  it("renders gender select with male and female options", () => {
    render(<TestWrapper>{}</TestWrapper>);

    expect(screen.getByText("Male")).toBeInTheDocument();
    expect(screen.getByText("Female")).toBeInTheDocument();
    expect(screen.getByText("Select gender")).toBeInTheDocument();
  });

  // Test 7: Referral source select has all 7 options
  it("renders referral source select with all 7 options", () => {
    render(<TestWrapper>{}</TestWrapper>);

    expect(screen.getByText("Instagram")).toBeInTheDocument();
    expect(screen.getByText("Member Referral")).toBeInTheDocument();
    expect(screen.getByText("Website/IB")).toBeInTheDocument();
    expect(screen.getByText("Prospection")).toBeInTheDocument();
    expect(screen.getByText("Studio Visit")).toBeInTheDocument();
    expect(screen.getByText("Phone")).toBeInTheDocument();
    expect(screen.getByText("Chatbot")).toBeInTheDocument();
    expect(screen.getByText("How did they find us?")).toBeInTheDocument();
  });

  // Test 8: Blue background styling is applied
  it("applies blue background styling to distinguish from main form", () => {
    const { container } = render(<TestWrapper>{}</TestWrapper>);

    const wrapper = container.querySelector(".bg-blue-50");
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveClass("bg-blue-50");
    expect(wrapper).toHaveClass("p-4");
    expect(wrapper).toHaveClass("rounded-lg");
    expect(wrapper).toHaveClass("border");
  });

  // Test 9: Component is memoized
  it("component is memoized for performance", () => {
    expect(TrialMemberRegistration).toBeDefined();
    expect(typeof TrialMemberRegistration).toBe("object");
    // React.memo adds $$typeof property
    expect(TrialMemberRegistration.$$typeof).toBeDefined();
  });

  // Test 10: Grid layout for name fields
  it("uses grid layout for name fields", () => {
    const { container } = render(<TestWrapper>{}</TestWrapper>);

    const grids = container.querySelectorAll(".grid");
    expect(grids.length).toBeGreaterThan(0);

    // Check for responsive grid classes
    const firstGrid = grids[0];
    expect(firstGrid).toHaveClass("grid-cols-1");
    expect(firstGrid).toHaveClass("md:grid-cols-2");
  });

  // Test 11: Heading has correct color styling
  it("heading has correct blue color styling", () => {
    const { container } = render(<TestWrapper>{}</TestWrapper>);

    const heading = screen.getByText("New Trial Member Registration");
    expect(heading).toHaveClass("text-blue-900");
    expect(heading).toHaveClass("dark:text-blue-100");
    expect(heading).toHaveClass("font-semibold");
    expect(heading).toHaveClass("text-sm");
  });

  // Test 12: All form fields are properly connected to react-hook-form
  it("renders FormField components for all 6 fields", () => {
    const { container } = render(<TestWrapper>{}</TestWrapper>);

    // Each field should have a form-item wrapper (from mocked FormItem)
    const formItems = container.querySelectorAll(".form-item");
    expect(formItems.length).toBe(6);
  });
});
