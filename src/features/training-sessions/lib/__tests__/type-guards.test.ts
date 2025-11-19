import { describe, it, expect } from "vitest";
import {
  isGuestSession,
  requiresMember,
  createsNewMember,
  bypassesWeeklyLimit,
  requiresTrialMember,
  countsTowardsCapacity,
} from "../type-guards";

describe("Session Type Guards", () => {
  describe("isGuestSession", () => {
    it("returns true for guest session types", () => {
      expect(isGuestSession("multi_site")).toBe(true);
      expect(isGuestSession("non_bookable")).toBe(true);
    });

    it("returns false for member session types", () => {
      expect(isGuestSession("trial")).toBe(false);
      expect(isGuestSession("member")).toBe(false);
      expect(isGuestSession("contractual")).toBe(false);
      expect(isGuestSession("makeup")).toBe(false);
      expect(isGuestSession("collaboration")).toBe(false); // Collaboration now requires members
    });
  });

  describe("requiresMember", () => {
    it("returns true for types requiring member selection", () => {
      expect(requiresMember("member")).toBe(true);
      expect(requiresMember("contractual")).toBe(true);
      expect(requiresMember("makeup")).toBe(true);
      expect(requiresMember("collaboration")).toBe(true); // Collaboration now requires members
    });

    it("returns false for types not requiring member", () => {
      expect(requiresMember("trial")).toBe(false);
      expect(requiresMember("multi_site")).toBe(false);
      expect(requiresMember("non_bookable")).toBe(false);
    });
  });

  describe("createsNewMember", () => {
    it("returns true only for trial sessions", () => {
      expect(createsNewMember("trial")).toBe(true);
    });

    it("returns false for all other session types", () => {
      expect(createsNewMember("member")).toBe(false);
      expect(createsNewMember("contractual")).toBe(false);
      expect(createsNewMember("multi_site")).toBe(false);
      expect(createsNewMember("collaboration")).toBe(false);
      expect(createsNewMember("makeup")).toBe(false);
      expect(createsNewMember("non_bookable")).toBe(false);
    });
  });

  describe("bypassesWeeklyLimit", () => {
    it("returns false only for member sessions (subject to weekly limit)", () => {
      expect(bypassesWeeklyLimit("member")).toBe(false);
    });

    it("returns true for all other session types (bypass weekly limit)", () => {
      expect(bypassesWeeklyLimit("makeup")).toBe(true);
      expect(bypassesWeeklyLimit("trial")).toBe(true);
      expect(bypassesWeeklyLimit("contractual")).toBe(true);
      expect(bypassesWeeklyLimit("multi_site")).toBe(true);
      expect(bypassesWeeklyLimit("collaboration")).toBe(true);
      expect(bypassesWeeklyLimit("non_bookable")).toBe(true);
    });
  });

  describe("requiresTrialMember", () => {
    it("returns true only for contractual sessions", () => {
      expect(requiresTrialMember("contractual")).toBe(true);
    });

    it("returns false for all other session types", () => {
      expect(requiresTrialMember("trial")).toBe(false);
      expect(requiresTrialMember("member")).toBe(false);
      expect(requiresTrialMember("multi_site")).toBe(false);
      expect(requiresTrialMember("collaboration")).toBe(false);
      expect(requiresTrialMember("makeup")).toBe(false);
      expect(requiresTrialMember("non_bookable")).toBe(false);
    });
  });

  describe("countsTowardsCapacity", () => {
    it("returns true for all types except non_bookable", () => {
      expect(countsTowardsCapacity("trial")).toBe(true);
      expect(countsTowardsCapacity("member")).toBe(true);
      expect(countsTowardsCapacity("contractual")).toBe(true);
      expect(countsTowardsCapacity("multi_site")).toBe(true);
      expect(countsTowardsCapacity("collaboration")).toBe(true);
      expect(countsTowardsCapacity("makeup")).toBe(true);
    });

    it("returns false for non_bookable sessions", () => {
      expect(countsTowardsCapacity("non_bookable")).toBe(false);
    });
  });
});
