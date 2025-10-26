import type { SessionType } from "@/features/database/lib/types";

/**
 * Get background color class for session type (TimeSlot cards)
 *
 * Returns Tailwind classes for:
 * - Background color (bg-*)
 * - Text color (text-white)
 * - Hover state (hover:bg-*)
 *
 * @param sessionType - The type of training session
 * @returns Tailwind CSS classes string
 */
export function getSessionTypeColor(sessionType: SessionType): string {
  const colors: Record<SessionType, string> = {
    trial: "bg-blue-500 text-white hover:bg-blue-600",
    member: "bg-green-500 text-white hover:bg-green-600",
    contractual: "bg-orange-500 text-white hover:bg-orange-600",
    multi_site: "bg-purple-500 text-white hover:bg-purple-600",
    collaboration: "bg-lime-600 text-white hover:bg-lime-700",
    makeup: "bg-blue-900 text-white hover:bg-blue-950",
    non_bookable: "bg-red-500 text-white hover:bg-red-600",
  };
  return colors[sessionType];
}

/**
 * Get badge color for session type labels
 *
 * Returns Tailwind classes for:
 * - Background color (bg-*-100)
 * - Text color (text-*-800/900)
 * - Border color (border-*-300/400)
 *
 * @param sessionType - The type of training session
 * @returns Tailwind CSS classes string
 */
export function getSessionTypeBadgeColor(sessionType: SessionType): string {
  const colors: Record<SessionType, string> = {
    trial: "bg-blue-100 text-blue-800 border-blue-300",
    member: "bg-green-100 text-green-800 border-green-300",
    contractual: "bg-orange-100 text-orange-800 border-orange-300",
    multi_site: "bg-purple-100 text-purple-800 border-purple-300",
    collaboration: "bg-lime-100 text-lime-800 border-lime-300",
    makeup: "bg-blue-100 text-blue-900 border-blue-400",
    non_bookable: "bg-red-100 text-red-800 border-red-300",
  };
  return colors[sessionType];
}

/**
 * Get border color for session type
 *
 * Returns Tailwind border color class (border-*-500/600/900)
 *
 * @param sessionType - The type of training session
 * @returns Tailwind CSS border class
 */
export function getSessionTypeBorderColor(sessionType: SessionType): string {
  const colors: Record<SessionType, string> = {
    trial: "border-blue-500",
    member: "border-green-500",
    contractual: "border-orange-500",
    multi_site: "border-purple-500",
    collaboration: "border-lime-600",
    makeup: "border-blue-900",
    non_bookable: "border-red-500",
  };
  return colors[sessionType];
}
