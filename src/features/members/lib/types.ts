/**
 * Member Feature Types
 * TypeScript interfaces for member-related data structures
 */

// ========== Body Checkup Types ==========

/**
 * Body checkup record from database
 */
export interface BodyCheckup {
  id: string;
  member_id: string;
  checkup_date: string; // ISO date string (YYYY-MM-DD)
  weight: number | null;
  notes: string | null;
  created_at: string; // ISO timestamp
  created_by: string | null;
}

/**
 * Input for creating a new body checkup
 */
export interface CreateBodyCheckupInput {
  member_id: string;
  checkup_date: string; // ISO date string (YYYY-MM-DD)
  weight?: number | null;
  notes?: string | null;
  created_by?: string | null;
}
