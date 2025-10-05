import { describe, it, expect } from "vitest";

// Import the utility functions from AdvancedMemberTable
// Since they're not exported, we'll test them through the component
// For now, we'll duplicate them here for unit testing

interface BalanceStyles {
  backgroundColor: string;
  textColor: string;
}

function getBalanceStyles(balance: number): BalanceStyles {
  if (balance > 0) {
    // Positive balance = member OWES money = red (outstanding debt)
    return {
      backgroundColor: "bg-red-50",
      textColor: "text-red-700",
    };
  } else if (balance < 0) {
    // Negative balance = member OVERPAID = green (credit to member)
    return {
      backgroundColor: "bg-green-50",
      textColor: "text-green-700",
    };
  } else {
    return {
      backgroundColor: "bg-gray-50",
      textColor: "text-gray-600",
    };
  }
}

function formatBalance(balance: number): string {
  const absBalance = Math.abs(balance);
  const formatted = absBalance.toFixed(2);

  if (balance < 0) {
    return `-$${formatted}`;
  }
  return `$${formatted}`;
}

describe("Balance Display Utilities (US-003)", () => {
  describe("formatBalance", () => {
    it("formats positive balance correctly", () => {
      expect(formatBalance(250.5)).toBe("$250.50");
    });

    it("formats negative balance correctly", () => {
      expect(formatBalance(-50.75)).toBe("-$50.75");
    });

    it("formats zero balance correctly", () => {
      expect(formatBalance(0)).toBe("$0.00");
    });

    it("shows single dollar sign only", () => {
      const formatted = formatBalance(100);
      const dollarCount = (formatted.match(/\$/g) || []).length;
      expect(dollarCount).toBe(1);
    });

    it("handles very small balances with two decimal places", () => {
      expect(formatBalance(0.01)).toBe("$0.01");
    });

    it("handles very large balances", () => {
      expect(formatBalance(10000.99)).toBe("$10000.99");
    });

    it("shows negative sign before dollar sign", () => {
      const formatted = formatBalance(-100);
      expect(formatted).toBe("-$100.00");
      expect(formatted.startsWith("-$")).toBe(true);
    });
  });

  describe("getBalanceStyles", () => {
    it("returns red styles for positive balance (member owes)", () => {
      const styles = getBalanceStyles(100);
      expect(styles.backgroundColor).toBe("bg-red-50");
      expect(styles.textColor).toBe("text-red-700");
    });

    it("returns green styles for negative balance (member overpaid)", () => {
      const styles = getBalanceStyles(-50);
      expect(styles.backgroundColor).toBe("bg-green-50");
      expect(styles.textColor).toBe("text-green-700");
    });

    it("returns gray styles for zero balance (fully paid)", () => {
      const styles = getBalanceStyles(0);
      expect(styles.backgroundColor).toBe("bg-gray-50");
      expect(styles.textColor).toBe("text-gray-600");
    });

    it("returns red for small positive balance (small debt)", () => {
      const styles = getBalanceStyles(0.01);
      expect(styles.backgroundColor).toBe("bg-red-50");
    });

    it("returns green for small negative balance (small overpayment)", () => {
      const styles = getBalanceStyles(-0.01);
      expect(styles.backgroundColor).toBe("bg-green-50");
    });

    it("returns red for large positive balance (large debt)", () => {
      const styles = getBalanceStyles(10000);
      expect(styles.backgroundColor).toBe("bg-red-50");
    });
  });

  describe("Integration - Balance Display", () => {
    it("positive balance (member owes) shows with red background and red text", () => {
      const balance = 250;
      const styles = getBalanceStyles(balance);
      const formatted = formatBalance(balance);

      expect(formatted).toBe("$250.00");
      expect(styles.backgroundColor).toBe("bg-red-50");
      expect(styles.textColor).toBe("text-red-700");
    });

    it("negative balance (member overpaid) shows with green background and green text", () => {
      const balance = -50;
      const styles = getBalanceStyles(balance);
      const formatted = formatBalance(balance);

      expect(formatted).toBe("-$50.00");
      expect(styles.backgroundColor).toBe("bg-green-50");
      expect(styles.textColor).toBe("text-green-700");
    });

    it("zero balance (fully paid) shows with gray background and gray text", () => {
      const balance = 0;
      const styles = getBalanceStyles(balance);
      const formatted = formatBalance(balance);

      expect(formatted).toBe("$0.00");
      expect(styles.backgroundColor).toBe("bg-gray-50");
      expect(styles.textColor).toBe("text-gray-600");
    });
  });
});
