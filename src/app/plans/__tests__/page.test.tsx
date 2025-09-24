import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import PlansManagementPage from "../page";

vi.mock("@/features/memberships/hooks/use-subscriptions", () => ({
  useSubscriptionPlans: () => ({
    data: [
      {
        id: "1",
        name: "Basic Plan",
        price: 99,
        sessions_count: 10,
        is_active: true,
        plan_type: "basic",
        billing_cycle: "monthly",
        duration_days: 30,
        signup_fee: 0,
        description: "Basic gym access",
      },
    ],
    isLoading: false,
    error: null,
  }),
}));

vi.mock("@/features/plans/components/PlanEditDialog", () => ({
  PlanEditDialog: () => (
    <div data-testid="plan-edit-dialog">Plan Edit Dialog</div>
  ),
}));

vi.mock("@/features/plans/components/PlanDeleteDialog", () => ({
  PlanDeleteDialog: () => (
    <div data-testid="plan-delete-dialog">Plan Delete Dialog</div>
  ),
}));

describe("PlansManagementPage", () => {
  it("renders plans management page", () => {
    render(<PlansManagementPage />);

    expect(screen.getByText("Subscription Plans")).toBeInTheDocument();
    expect(screen.getByText("New Plan")).toBeInTheDocument();
    expect(screen.getByText("Basic Plan")).toBeInTheDocument();
  });
});
