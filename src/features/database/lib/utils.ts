// Database utility functions and helpers
import { supabase } from "@/lib/supabase";
import type {
  Member,
  UserProfile,
  Equipment,
  SubscriptionPlan,
  MemberSubscription,
  Class,
  Trainer,
  ClassBooking,
  AttendanceLog,
} from "./types";

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

// Generic database operations
export async function executeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: unknown }>
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

  if (!data) {
    throw new DatabaseError("No data returned from query");
  }

  return data;
}

// Basic member utilities (simplified)
export const memberUtils = {
  async getMemberById(id: string): Promise<Member | null> {
    return executeQuery(async () => {
      return await supabase.from("members").select("*").eq("id", id).single();
    });
  },

  async getAllMembers(): Promise<Member[]> {
    return executeQuery(async () => {
      return await supabase
        .from("members")
        .select("*")
        .order("created_at", { ascending: false });
    });
  },

  // TODO: Add more member utilities as needed
};

// Basic equipment utilities (simplified)
export const equipmentUtils = {
  async getAllEquipment(): Promise<Equipment[]> {
    return executeQuery(async () => {
      return await supabase.from("equipment").select("*").order("name");
    });
  },

  // TODO: Add more equipment utilities as needed
};

// Basic class utilities (simplified)
export const classUtils = {
  async getAllClasses(): Promise<Class[]> {
    return executeQuery(async () => {
      return await supabase
        .from("classes")
        .select("*")
        .order("date", { ascending: true });
    });
  },

  // TODO: Add more class utilities as needed
};

// Database connection test utility
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("members")
      .select("count", { count: "exact", head: true });
    return !error;
  } catch (error) {
    console.error("Database connection test failed:", error);
    return false;
  }
}

// Export a default object with all utilities
export const databaseUtils = {
  members: memberUtils,
  equipment: equipmentUtils,
  classes: classUtils,
  testConnection: testDatabaseConnection,
};
