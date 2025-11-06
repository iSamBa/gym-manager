import { supabase } from "./supabase";
import { logger } from "./logger";

export interface ProfileIntegrityIssue {
  type: "missing_profile" | "incomplete_profile" | "orphaned_auth_user";
  severity: "critical" | "warning";
  userId: string;
  userEmail?: string;
  message: string;
  suggestedAction: string;
}

export interface ProfileIntegrityCheckResult {
  hasIssues: boolean;
  issues: ProfileIntegrityIssue[];
  checkedAt: Date;
}

/**
 * Check if the current authenticated user has a complete profile
 * This is called after successful authentication to ensure data integrity
 */
export async function checkCurrentUserProfileIntegrity(
  userId: string,
  userEmail?: string
): Promise<ProfileIntegrityCheckResult> {
  const result: ProfileIntegrityCheckResult = {
    hasIssues: false,
    issues: [],
    checkedAt: new Date(),
  };

  try {
    // Check if user_profile exists
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("id, email, role, first_name, last_name, is_active")
      .eq("id", userId)
      .maybeSingle(); // Use maybeSingle to avoid error when no rows

    if (error) {
      logger.error("Profile integrity check query failed", {
        error: error.message,
        userId,
        userEmail,
      });

      result.hasIssues = true;
      result.issues.push({
        type: "missing_profile",
        severity: "critical",
        userId,
        userEmail,
        message: "Failed to query user profile",
        suggestedAction: "Check database connection and RLS policies",
      });

      return result;
    }

    if (!profile) {
      // Profile doesn't exist - CRITICAL
      logger.error("CRITICAL: User authenticated but profile missing", {
        userId,
        userEmail,
        severity: "CRITICAL",
      });

      result.hasIssues = true;
      result.issues.push({
        type: "missing_profile",
        severity: "critical",
        userId,
        userEmail,
        message: `User profile missing for ${userEmail || userId}`,
        suggestedAction:
          "Create user_profiles record or delete auth.users record",
      });

      return result;
    }

    // Check for incomplete profile data
    const incompleteFields: string[] = [];

    if (!profile.email) incompleteFields.push("email");
    if (!profile.role) incompleteFields.push("role");
    if (profile.is_active === null || profile.is_active === undefined)
      incompleteFields.push("is_active");

    if (incompleteFields.length > 0) {
      logger.warn("User profile has incomplete data", {
        userId,
        userEmail,
        incompleteFields,
      });

      result.hasIssues = true;
      result.issues.push({
        type: "incomplete_profile",
        severity: "warning",
        userId,
        userEmail: profile.email,
        message: `Profile missing fields: ${incompleteFields.join(", ")}`,
        suggestedAction: "Update user_profiles record with missing data",
      });
    }

    return result;
  } catch (error) {
    logger.error("Unexpected error during profile integrity check", {
      error: error instanceof Error ? error.message : String(error),
      userId,
      userEmail,
    });

    result.hasIssues = true;
    result.issues.push({
      type: "missing_profile",
      severity: "critical",
      userId,
      userEmail,
      message: "Unexpected error checking profile integrity",
      suggestedAction: "Check application logs for details",
    });

    return result;
  }
}

/**
 * Check for orphaned auth users (users without profiles) across the entire database
 * This is an admin-only function for system health monitoring
 */
export async function checkAllProfileIntegrity(): Promise<ProfileIntegrityCheckResult> {
  const result: ProfileIntegrityCheckResult = {
    hasIssues: false,
    issues: [],
    checkedAt: new Date(),
  };

  try {
    // Query auth.users vs user_profiles
    const { data: orphanedUsers, error } = await supabase.rpc(
      "get_orphaned_auth_users"
    );

    if (error) {
      logger.error("Failed to check for orphaned users", {
        error: error.message,
      });
      return result;
    }

    if (orphanedUsers && orphanedUsers.length > 0) {
      result.hasIssues = true;

      orphanedUsers.forEach(
        (user: { id: string; email: string; created_at: string }) => {
          result.issues.push({
            type: "orphaned_auth_user",
            severity: "critical",
            userId: user.id,
            userEmail: user.email,
            message: `Orphaned auth user: ${user.email}`,
            suggestedAction:
              "Create matching user_profiles record or delete auth user",
          });
        }
      );

      logger.error("Orphaned auth users detected", {
        count: orphanedUsers.length,
        users: orphanedUsers.map((u: { email: string }) => u.email),
      });
    }

    return result;
  } catch (error) {
    logger.error("Unexpected error checking all profile integrity", {
      error: error instanceof Error ? error.message : String(error),
    });

    return result;
  }
}
