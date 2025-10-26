import { describe, it, expect } from "vitest";
import {
  getSessionTypeColor,
  getSessionTypeBadgeColor,
  getSessionTypeBorderColor,
} from "../session-colors";
import type { SessionType } from "@/features/database/lib/types";

describe("Session Type Color System", () => {
  describe("getSessionTypeColor", () => {
    it("returns correct background color for trial sessions", () => {
      const color = getSessionTypeColor("trial");
      expect(color).toBe(
        "bg-blue-500/15 text-gray-900 dark:text-white hover:bg-blue-600/25"
      );
    });

    it("returns correct background color for member sessions", () => {
      const color = getSessionTypeColor("member");
      expect(color).toBe(
        "bg-green-500/15 text-gray-900 dark:text-white hover:bg-green-600/25"
      );
    });

    it("returns correct background color for contractual sessions", () => {
      const color = getSessionTypeColor("contractual");
      expect(color).toBe(
        "bg-orange-500/15 text-gray-900 dark:text-white hover:bg-orange-600/25"
      );
    });

    it("returns correct background color for multi_site sessions", () => {
      const color = getSessionTypeColor("multi_site");
      expect(color).toBe(
        "bg-purple-500/15 text-gray-900 dark:text-white hover:bg-purple-600/25"
      );
    });

    it("returns correct background color for collaboration sessions", () => {
      const color = getSessionTypeColor("collaboration");
      expect(color).toBe(
        "bg-lime-600/15 text-gray-900 dark:text-white hover:bg-lime-700/25"
      );
    });

    it("returns correct background color for makeup sessions", () => {
      const color = getSessionTypeColor("makeup");
      expect(color).toBe(
        "bg-blue-900/15 text-gray-900 dark:text-white hover:bg-blue-950/25"
      );
    });

    it("returns correct background color for non_bookable sessions", () => {
      const color = getSessionTypeColor("non_bookable");
      expect(color).toBe(
        "bg-red-500/15 text-gray-900 dark:text-white hover:bg-red-600/25"
      );
    });

    it("includes text color in all color variants", () => {
      const sessionTypes: SessionType[] = [
        "trial",
        "member",
        "contractual",
        "multi_site",
        "collaboration",
        "makeup",
        "non_bookable",
      ];

      sessionTypes.forEach((type) => {
        const color = getSessionTypeColor(type);
        // Now uses conditional text color: text-gray-900 dark:text-white
        expect(color).toMatch(/text-(white|gray-900)/);
      });
    });

    it("includes hover state in all color variants", () => {
      const sessionTypes: SessionType[] = [
        "trial",
        "member",
        "contractual",
        "multi_site",
        "collaboration",
        "makeup",
        "non_bookable",
      ];

      sessionTypes.forEach((type) => {
        const color = getSessionTypeColor(type);
        expect(color).toContain("hover:");
      });
    });

    it("does NOT use time-based color strings", () => {
      const sessionTypes: SessionType[] = [
        "trial",
        "member",
        "contractual",
        "multi_site",
        "collaboration",
        "makeup",
        "non_bookable",
      ];

      sessionTypes.forEach((type) => {
        const color = getSessionTypeColor(type);
        expect(color).not.toContain("past");
        expect(color).not.toContain("today");
        expect(color).not.toContain("future");
      });
    });
  });

  describe("getSessionTypeBadgeColor", () => {
    it("returns correct badge color for trial sessions", () => {
      const color = getSessionTypeBadgeColor("trial");
      expect(color).toBe("bg-blue-100 text-blue-800 border-blue-300");
    });

    it("returns correct badge color for member sessions", () => {
      const color = getSessionTypeBadgeColor("member");
      expect(color).toBe("bg-green-100 text-green-800 border-green-300");
    });

    it("returns correct badge color for contractual sessions", () => {
      const color = getSessionTypeBadgeColor("contractual");
      expect(color).toBe("bg-orange-100 text-orange-800 border-orange-300");
    });

    it("returns correct badge color for multi_site sessions", () => {
      const color = getSessionTypeBadgeColor("multi_site");
      expect(color).toBe("bg-purple-100 text-purple-800 border-purple-300");
    });

    it("returns correct badge color for collaboration sessions", () => {
      const color = getSessionTypeBadgeColor("collaboration");
      expect(color).toBe("bg-lime-100 text-lime-800 border-lime-300");
    });

    it("returns correct badge color for makeup sessions", () => {
      const color = getSessionTypeBadgeColor("makeup");
      expect(color).toBe("bg-blue-100 text-blue-900 border-blue-400");
    });

    it("returns correct badge color for non_bookable sessions", () => {
      const color = getSessionTypeBadgeColor("non_bookable");
      expect(color).toBe("bg-red-100 text-red-800 border-red-300");
    });

    it("includes background color in all badge variants", () => {
      const sessionTypes: SessionType[] = [
        "trial",
        "member",
        "contractual",
        "multi_site",
        "collaboration",
        "makeup",
        "non_bookable",
      ];

      sessionTypes.forEach((type) => {
        const color = getSessionTypeBadgeColor(type);
        expect(color).toContain("bg-");
      });
    });

    it("includes text color in all badge variants", () => {
      const sessionTypes: SessionType[] = [
        "trial",
        "member",
        "contractual",
        "multi_site",
        "collaboration",
        "makeup",
        "non_bookable",
      ];

      sessionTypes.forEach((type) => {
        const color = getSessionTypeBadgeColor(type);
        expect(color).toContain("text-");
      });
    });

    it("includes border color in all badge variants", () => {
      const sessionTypes: SessionType[] = [
        "trial",
        "member",
        "contractual",
        "multi_site",
        "collaboration",
        "makeup",
        "non_bookable",
      ];

      sessionTypes.forEach((type) => {
        const color = getSessionTypeBadgeColor(type);
        expect(color).toContain("border-");
      });
    });

    it("does NOT use time-based color strings", () => {
      const sessionTypes: SessionType[] = [
        "trial",
        "member",
        "contractual",
        "multi_site",
        "collaboration",
        "makeup",
        "non_bookable",
      ];

      sessionTypes.forEach((type) => {
        const color = getSessionTypeBadgeColor(type);
        expect(color).not.toContain("past");
        expect(color).not.toContain("today");
        expect(color).not.toContain("future");
      });
    });
  });

  describe("getSessionTypeBorderColor", () => {
    it("returns correct border color for trial sessions", () => {
      const color = getSessionTypeBorderColor("trial");
      expect(color).toBe("border-blue-500");
    });

    it("returns correct border color for member sessions", () => {
      const color = getSessionTypeBorderColor("member");
      expect(color).toBe("border-green-500");
    });

    it("returns correct border color for contractual sessions", () => {
      const color = getSessionTypeBorderColor("contractual");
      expect(color).toBe("border-orange-500");
    });

    it("returns correct border color for multi_site sessions", () => {
      const color = getSessionTypeBorderColor("multi_site");
      expect(color).toBe("border-purple-500");
    });

    it("returns correct border color for collaboration sessions", () => {
      const color = getSessionTypeBorderColor("collaboration");
      expect(color).toBe("border-lime-600");
    });

    it("returns correct border color for makeup sessions", () => {
      const color = getSessionTypeBorderColor("makeup");
      expect(color).toBe("border-blue-900");
    });

    it("returns correct border color for non_bookable sessions", () => {
      const color = getSessionTypeBorderColor("non_bookable");
      expect(color).toBe("border-red-500");
    });

    it("all border colors start with border- prefix", () => {
      const sessionTypes: SessionType[] = [
        "trial",
        "member",
        "contractual",
        "multi_site",
        "collaboration",
        "makeup",
        "non_bookable",
      ];

      sessionTypes.forEach((type) => {
        const color = getSessionTypeBorderColor(type);
        expect(color).toMatch(/^border-/);
      });
    });

    it("does NOT use time-based color strings", () => {
      const sessionTypes: SessionType[] = [
        "trial",
        "member",
        "contractual",
        "multi_site",
        "collaboration",
        "makeup",
        "non_bookable",
      ];

      sessionTypes.forEach((type) => {
        const color = getSessionTypeBorderColor(type);
        expect(color).not.toContain("past");
        expect(color).not.toContain("today");
        expect(color).not.toContain("future");
      });
    });
  });

  describe("Color Consistency", () => {
    it("trial sessions use consistent blue color family", () => {
      const bgColor = getSessionTypeColor("trial");
      const badgeColor = getSessionTypeBadgeColor("trial");
      const borderColor = getSessionTypeBorderColor("trial");

      expect(bgColor).toContain("blue");
      expect(badgeColor).toContain("blue");
      expect(borderColor).toContain("blue");
    });

    it("member sessions use consistent green color family", () => {
      const bgColor = getSessionTypeColor("member");
      const badgeColor = getSessionTypeBadgeColor("member");
      const borderColor = getSessionTypeBorderColor("member");

      expect(bgColor).toContain("green");
      expect(badgeColor).toContain("green");
      expect(borderColor).toContain("green");
    });

    it("contractual sessions use consistent orange color family", () => {
      const bgColor = getSessionTypeColor("contractual");
      const badgeColor = getSessionTypeBadgeColor("contractual");
      const borderColor = getSessionTypeBorderColor("contractual");

      expect(bgColor).toContain("orange");
      expect(badgeColor).toContain("orange");
      expect(borderColor).toContain("orange");
    });

    it("multi_site sessions use consistent purple color family", () => {
      const bgColor = getSessionTypeColor("multi_site");
      const badgeColor = getSessionTypeBadgeColor("multi_site");
      const borderColor = getSessionTypeBorderColor("multi_site");

      expect(bgColor).toContain("purple");
      expect(badgeColor).toContain("purple");
      expect(borderColor).toContain("purple");
    });

    it("collaboration sessions use consistent lime color family", () => {
      const bgColor = getSessionTypeColor("collaboration");
      const badgeColor = getSessionTypeBadgeColor("collaboration");
      const borderColor = getSessionTypeBorderColor("collaboration");

      expect(bgColor).toContain("lime");
      expect(badgeColor).toContain("lime");
      expect(borderColor).toContain("lime");
    });

    it("makeup sessions use consistent blue color family", () => {
      const bgColor = getSessionTypeColor("makeup");
      const badgeColor = getSessionTypeBadgeColor("makeup");
      const borderColor = getSessionTypeBorderColor("makeup");

      expect(bgColor).toContain("blue");
      expect(badgeColor).toContain("blue");
      expect(borderColor).toContain("blue");
    });

    it("non_bookable sessions use consistent red color family", () => {
      const bgColor = getSessionTypeColor("non_bookable");
      const badgeColor = getSessionTypeBadgeColor("non_bookable");
      const borderColor = getSessionTypeBorderColor("non_bookable");

      expect(bgColor).toContain("red");
      expect(badgeColor).toContain("red");
      expect(borderColor).toContain("red");
    });
  });
});
