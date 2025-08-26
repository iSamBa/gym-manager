import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemberAvatar } from "../MemberAvatar";
import type { Member } from "@/features/database/lib/types";

const mockMember: Pick<Member, "id" | "first_name" | "last_name"> = {
  id: "123",
  first_name: "John",
  last_name: "Doe",
};

describe("MemberAvatar", () => {
  it("renders initials correctly", () => {
    render(<MemberAvatar member={mockMember} />);

    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("applies correct size classes", () => {
    const { rerender } = render(<MemberAvatar member={mockMember} size="xs" />);
    expect(document.querySelector(".h-6")).toBeInTheDocument();

    rerender(<MemberAvatar member={mockMember} size="xl" />);
    expect(document.querySelector(".h-24")).toBeInTheDocument();
  });

  it("shows status indicator when enabled", () => {
    render(<MemberAvatar member={mockMember} showStatus />);

    const statusDot = document.querySelector(".bg-green-500");
    expect(statusDot).toBeInTheDocument();
    expect(statusDot).toHaveAttribute("aria-label", "Online status");
  });

  it("handles click events", () => {
    const handleClick = vi.fn();
    render(<MemberAvatar member={mockMember} onClick={handleClick} />);

    const avatar = document.querySelector(".cursor-pointer");
    expect(avatar).toBeInTheDocument();

    avatar?.click();
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("applies custom className", () => {
    render(<MemberAvatar member={mockMember} className="custom-class" />);
    expect(document.querySelector(".custom-class")).toBeInTheDocument();
  });
});
