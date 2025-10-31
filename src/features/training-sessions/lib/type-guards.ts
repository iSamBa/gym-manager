import type { SessionType } from "@/features/database/lib/types";

/**
 * Check if session type is a guest session (no member_id)
 * Guest sessions include multi_site, collaboration, and non_bookable
 */
export function isGuestSession(type: SessionType): boolean {
  return ["multi_site", "collaboration", "non_bookable"].includes(type);
}

/**
 * Check if session type requires member selection
 * Member-required sessions include member, contractual, and makeup
 */
export function requiresMember(type: SessionType): boolean {
  return ["member", "contractual", "makeup"].includes(type);
}

/**
 * Check if session type creates a new member (trial only)
 * Only trial sessions create new members during booking
 */
export function createsNewMember(type: SessionType): boolean {
  return type === "trial";
}

/**
 * Check if session type bypasses weekly limit
 * Makeup sessions bypass the member's weekly session limit
 */
export function bypassesWeeklyLimit(type: SessionType): boolean {
  return type === "makeup";
}

/**
 * Check if session type requires trial member filter
 * Contractual sessions can only be booked by trial members
 */
export function requiresTrialMember(type: SessionType): boolean {
  return type === "contractual";
}

/**
 * Check if session type counts towards studio capacity
 * All session types count towards capacity except non_bookable
 */
export function countsTowardsCapacity(type: SessionType): boolean {
  return type !== "non_bookable";
}
