import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemberStatusBadge } from "../MemberStatusBadge";
import { createQueryWrapper } from "@/test/query-test-utils";

// Mock the hooks
const mockUpdateMemberStatus = {
  mutateAsync: vi.fn(),
  isPending: false,
};

vi.mock("@/features/members/hooks", () => ({
  useUpdateMemberStatus: () => mockUpdateMemberStatus,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("MemberStatusBadge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateMemberStatus.isPending = false;
  });

  it("renders status badge with correct label", () => {
    render(<MemberStatusBadge status="active" memberId="123" readonly />, {
      wrapper: createQueryWrapper(),
    });

    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders readonly badge when readonly prop is true", () => {
    render(<MemberStatusBadge status="suspended" memberId="123" readonly />, {
      wrapper: createQueryWrapper(),
    });

    expect(screen.getByText("Suspended")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows dropdown button when interactive", () => {
    render(<MemberStatusBadge status="active" memberId="123" />, {
      wrapper: createQueryWrapper(),
    });

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("shows loading state during mutation", () => {
    mockUpdateMemberStatus.isPending = true;

    render(<MemberStatusBadge status="active" memberId="123" />, {
      wrapper: createQueryWrapper(),
    });

    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });
});
