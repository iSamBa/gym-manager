import { describe, it, expect } from "vitest";
import { mapUserForLayout } from "../auth-utils";

describe("mapUserForLayout", () => {
  it("should return undefined for null user", () => {
    const result = mapUserForLayout(null);
    expect(result).toBeUndefined();
  });

  it("should map user with first_name and last_name", () => {
    const user = {
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
      avatar_url: "https://example.com/avatar.jpg",
    };

    const result = mapUserForLayout(user);
    expect(result).toEqual({
      name: "John Doe",
      email: "john@example.com",
      avatar: "https://example.com/avatar.jpg",
    });
  });

  it("should use email as name when no first/last name", () => {
    const user = {
      email: "john@example.com",
    };

    const result = mapUserForLayout(user);
    expect(result).toEqual({
      name: "john@example.com",
      email: "john@example.com",
      avatar: "j",
    });
  });

  it("should use first letter of first_name as avatar when no avatar_url", () => {
    const user = {
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
    };

    const result = mapUserForLayout(user);
    expect(result).toEqual({
      name: "John Doe",
      email: "john@example.com",
      avatar: "J",
    });
  });

  it("should use first letter of email as avatar when no other options", () => {
    const user = {
      email: "john@example.com",
    };

    const result = mapUserForLayout(user);
    expect(result).toEqual({
      name: "john@example.com",
      email: "john@example.com",
      avatar: "j",
    });
  });

  it("should use 'A' as fallback avatar", () => {
    const user = {};

    const result = mapUserForLayout(user);
    expect(result).toEqual({
      name: "Unknown User",
      email: "",
      avatar: "A",
    });
  });

  it("should handle undefined/null properties gracefully", () => {
    const user = {
      first_name: undefined,
      last_name: null,
      email: undefined,
      avatar_url: null,
    };

    const result = mapUserForLayout(user);
    expect(result).toEqual({
      name: "Unknown User",
      email: "",
      avatar: "A",
    });
  });
});
