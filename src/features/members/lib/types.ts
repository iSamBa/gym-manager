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

// ========== Auto-Inactivation Types ==========

/**
 * Result from running auto-inactivation process
 */
export interface AutoInactivationResult {
  inactivated_count: number;
  member_ids: string[];
  member_names: string[];
}

/**
 * Member candidate for auto-inactivation (dry-run preview)
 */
export interface InactivationCandidate {
  member_id: string;
  member_name: string;
  last_session_date: string | null; // ISO date string or null if never attended
  days_inactive: number | null; // Null if never attended
}

/**
 * Auto-inactivation run history record
 */
export interface AutoInactivationRun {
  id: string;
  run_at: string; // ISO timestamp
  inactivated_count: number;
  member_ids: string[];
  member_names: string[];
  run_by_user_id: string | null;
  created_at: string; // ISO timestamp
}
