// Shared database utilities and query helpers
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

// Error handling utility
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "DatabaseError";
  }
}

// Admin validation utility
export async function validateAdminAccess(): Promise<void> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new DatabaseError("Authentication required");
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    throw new DatabaseError("Admin privileges required for this operation");
  }
}

// Generic database operations
export async function executeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: unknown }>,
  options?: { allowNullData?: boolean }
): Promise<T> {
  const { data, error } = await queryFn();

  if (error) {
    // Type guard for error objects
    const errorMessage =
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string"
        ? error.message
        : "Database operation failed";
    const errorCode =
      error &&
      typeof error === "object" &&
      "code" in error &&
      typeof error.code === "string"
        ? error.code
        : undefined;
    const errorDetails =
      error && typeof error === "object" && "details" in error
        ? error.details
        : undefined;

    throw new DatabaseError(errorMessage, errorCode, errorDetails);
  }

  if (!data && !options?.allowNullData) {
    throw new DatabaseError("No data returned from query");
  }

  return data as T;
}

// Database connection test utility
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("members")
      .select("count", { count: "exact", head: true });
    return !error;
  } catch (error) {
    logger.error("Database connection test failed:", { error });
    return false;
  }
}
