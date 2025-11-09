/**
 * Security Test: Verify ProgressiveMemberForm does NOT use localStorage
 *
 * This test ensures that the XSS vulnerability fix remains in place.
 * If localStorage is ever reintroduced, this test will fail.
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("ProgressiveMemberForm - localStorage Security", () => {
  it("SECURITY: Component source should NOT contain active localStorage usage", () => {
    // Read the component source file
    const componentPath = path.join(
      process.cwd(),
      "src/features/members/components/ProgressiveMemberForm.tsx"
    );
    const componentSource = fs.readFileSync(componentPath, "utf-8");

    // Verify security comment exists
    expect(componentSource).toContain(
      "localStorage persistence removed for security"
    );
    expect(componentSource).toContain("prevents XSS access to sensitive data");

    // Find all localStorage references
    const localStorageMatches = componentSource.match(/localStorage\./g) || [];

    // Find localStorage references in comments only
    const commentMatches = componentSource.match(/\/\/.*localStorage\./g) || [];

    // All localStorage references should be in comments (no active usage)
    expect(localStorageMatches.length).toBe(commentMatches.length);

    // Should NOT contain localStorage.setItem in active code
    const setItemMatches =
      componentSource.match(/^\s*localStorage\.setItem/gm) || [];
    expect(setItemMatches.length).toBe(0);

    // Should NOT contain localStorage.getItem in active code
    const getItemMatches =
      componentSource.match(/^\s*localStorage\.getItem/gm) || [];
    expect(getItemMatches.length).toBe(0);

    // Should NOT contain localStorage.removeItem in active code
    const removeItemMatches =
      componentSource.match(/^\s*localStorage\.removeItem/gm) || [];
    expect(removeItemMatches.length).toBe(0);

    // Should NOT contain formStorageKey variable
    expect(componentSource).not.toContain("const formStorageKey");
    expect(componentSource).not.toContain("formStorageKey =");
  });

  it("SECURITY: Should have documented the localStorage removal", () => {
    const componentPath = path.join(
      process.cwd(),
      "src/features/members/components/ProgressiveMemberForm.tsx"
    );
    const componentSource = fs.readFileSync(componentPath, "utf-8");

    // Verify we document WHY we removed it
    expect(componentSource).toContain("in-memory");
    expect(componentSource).toContain("security");

    // Verify we mention the tradeoff
    expect(componentSource).toContain("lost on page refresh");
  });

  it("SECURITY: localStorage removal is properly documented in code", () => {
    const componentPath = path.join(
      process.cwd(),
      "src/features/members/components/ProgressiveMemberForm.tsx"
    );
    const componentSource = fs.readFileSync(componentPath, "utf-8");

    // Verify the security fix is documented in the component itself
    // This is more maintainable than requiring separate documentation files
    expect(componentSource).toContain("localStorage persistence removed");
    expect(componentSource).toContain("security");
    expect(componentSource).toContain("XSS");
  });
});
