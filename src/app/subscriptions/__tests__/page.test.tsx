import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import SubscriptionsManagementPage from "../page";

vi.mock("@/features/memberships/hooks/use-all-subscriptions", () => ({
  useAllSubscriptions: () => ({
    data: {
      subscriptions: [
        {
          id: "1",
          member_id: "member1",
          status: "active",
          used_sessions: 5,
          total_sessions_snapshot: 10,
          paid_amount: 99,
          total_amount_snapshot: 99,
          plan_name_snapshot: "Basic Plan",
          end_date: "2024-01-01",
          members: {
            first_name: "John",
            last_name: "Doe",
            email: "john@example.com",
          },
        },
      ],
      totalCount: 1,
    },
    isLoading: false,
    error: null,
  }),
}));

vi.mock("@/features/memberships/hooks/use-subscriptions", () => ({
  usePauseSubscription: () => ({ mutateAsync: vi.fn() }),
  useResumeSubscription: () => ({ mutateAsync: vi.fn() }),
}));

describe("SubscriptionsManagementPage", () => {
  it("renders subscriptions management page", () => {
    render(<SubscriptionsManagementPage />);

    expect(screen.getByText("Subscriptions")).toBeInTheDocument();
    expect(screen.getByText("Basic Plan")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });
});
