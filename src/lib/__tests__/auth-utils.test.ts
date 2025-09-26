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
      avatar: undefined,
    });
  });

  it("should use undefined as avatar when no avatar_url", () => {
    const user = {
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
    };

    const result = mapUserForLayout(user);
    expect(result).toEqual({
      name: "John Doe",
      email: "john@example.com",
      avatar: undefined,
    });
  });

  it("should use undefined as avatar when no avatar_url provided", () => {
    const user = {
      email: "john@example.com",
    };

    const result = mapUserForLayout(user);
    expect(result).toEqual({
      name: "john@example.com",
      email: "john@example.com",
      avatar: undefined,
    });
  });

  it("should use undefined as fallback avatar", () => {
    const user = {};

    const result = mapUserForLayout(user);
    expect(result).toEqual({
      name: "Unknown User",
      email: "",
      avatar: undefined,
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
      avatar: undefined,
    });
  });
});
