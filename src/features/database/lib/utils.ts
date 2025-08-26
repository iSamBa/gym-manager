// Database utility functions and helpers
import { supabase } from "@/lib/supabase";
import type {
  Member,
  Equipment,
  Class,
  MemberStatus,
  Gender,
  Address,
  MemberWithSubscription,
  Trainer,
  TrainerWithProfile,
  TrainerSpecialization,
  EmergencyContact,
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

// Enhanced member utilities for TanStack Query integration
export interface MemberFilters {
  status?: MemberStatus | MemberStatus[];
  search?: string;
  joinDateFrom?: string;
  joinDateTo?: string;
  limit?: number;
  offset?: number;
}

export interface CreateMemberData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: Gender;
  address?: Address;
  profile_picture_url?: string;
  status?: MemberStatus;
  join_date?: string;
  notes?: string;
  medical_conditions?: string;
  fitness_goals?: string;
  preferred_contact_method?: string;
  marketing_consent?: boolean;
  waiver_signed?: boolean;
  waiver_signed_date?: string;
}

export interface UpdateMemberData {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: Gender;
  address?: Address;
  profile_picture_url?: string;
  status?: MemberStatus;
  notes?: string;
  medical_conditions?: string;
  fitness_goals?: string;
  preferred_contact_method?: string;
  marketing_consent?: boolean;
  waiver_signed?: boolean;
  waiver_signed_date?: string;
}

// Enhanced trainer utilities for TanStack Query integration
export interface TrainerFilters {
  status?: "active" | "inactive";
  search?: string;
  specializations?: string[];
  isAcceptingNewClients?: boolean;
  yearsExperienceMin?: number;
  yearsExperienceMax?: number;
  limit?: number;
  offset?: number;
}

export interface CreateTrainerData {
  trainer_code: string;
  hourly_rate?: number;
  commission_rate?: number;
  max_clients_per_session?: number;
  years_experience?: number;
  certifications?: string[];
  specializations?: string[];
  languages?: string[];
  availability?: Record<string, unknown>;
  is_accepting_new_clients?: boolean;
  emergency_contact?: EmergencyContact;
  insurance_policy_number?: string;
  background_check_date?: string;
  cpr_certification_expires?: string;
  notes?: string;
  // User profile data for trainer creation
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  profile_picture_url?: string;
}

export interface UpdateTrainerData {
  trainer_code?: string;
  hourly_rate?: number;
  commission_rate?: number;
  max_clients_per_session?: number;
  years_experience?: number;
  certifications?: string[];
  specializations?: string[];
  languages?: string[];
  availability?: Record<string, unknown>;
  is_accepting_new_clients?: boolean;
  emergency_contact?: EmergencyContact;
  insurance_policy_number?: string;
  background_check_date?: string;
  cpr_certification_expires?: string;
  notes?: string;
}

export const memberUtils = {
  // Core CRUD operations
  async getMemberById(id: string): Promise<Member> {
    return executeQuery(async () => {
      return await supabase.from("members").select("*").eq("id", id).single();
    });
  },

  async getMembers(filters: MemberFilters = {}): Promise<Member[]> {
    return executeQuery(async () => {
      let query = supabase
        .from("members")
        .select("*")
        .order("created_at", { ascending: false });

      // Apply status filter
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          query = query.in("status", filters.status);
        } else {
          query = query.eq("status", filters.status);
        }
      }

      // Apply search filter (searches first_name, last_name, email)
      if (filters.search) {
        query = query.or(
          `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
        );
      }

      // Apply date range filters
      if (filters.joinDateFrom) {
        query = query.gte("join_date", filters.joinDateFrom);
      }
      if (filters.joinDateTo) {
        query = query.lte("join_date", filters.joinDateTo);
      }

      // Apply pagination
      if (filters.offset !== undefined) {
        query = query.range(
          filters.offset,
          filters.offset + (filters.limit || 50) - 1
        );
      } else if (filters.limit) {
        query = query.limit(filters.limit);
      }

      return query;
    });
  },

  async createMember(memberData: CreateMemberData): Promise<Member> {
    return executeQuery(async () => {
      return await supabase
        .from("members")
        .insert({
          ...memberData,
          status: memberData.status || "active",
          join_date:
            memberData.join_date || new Date().toISOString().split("T")[0],
          preferred_contact_method:
            memberData.preferred_contact_method || "email",
          marketing_consent: memberData.marketing_consent ?? false,
          waiver_signed: memberData.waiver_signed ?? false,
        })
        .select("*")
        .single();
    });
  },

  async updateMember(
    id: string,
    memberData: UpdateMemberData
  ): Promise<Member> {
    return executeQuery(async () => {
      return await supabase
        .from("members")
        .update({
          ...memberData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*")
        .single();
    });
  },

  async updateMemberStatus(id: string, status: MemberStatus): Promise<Member> {
    return executeQuery(async () => {
      return await supabase
        .from("members")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*")
        .single();
    });
  },

  async deleteMember(id: string): Promise<void> {
    await executeQuery(async () => {
      const { data, error } = await supabase
        .from("members")
        .delete()
        .eq("id", id);
      return { data: data || null, error };
    });
  },

  // Search and filtering
  async searchMembers(query: string): Promise<Member[]> {
    if (!query || query.length < 2) {
      return [];
    }

    return executeQuery(async () => {
      return await supabase
        .from("members")
        .select("*")
        .or(
          `first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`
        )
        .order("created_at", { ascending: false })
        .limit(20);
    });
  },

  // Bulk operations
  async bulkUpdateStatus(
    memberIds: string[],
    status: MemberStatus
  ): Promise<Member[]> {
    return executeQuery(async () => {
      return await supabase
        .from("members")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .in("id", memberIds)
        .select("*");
    });
  },

  async getMembersByStatus(status: MemberStatus): Promise<Member[]> {
    return executeQuery(async () => {
      return await supabase
        .from("members")
        .select("*")
        .eq("status", status)
        .order("created_at", { ascending: false });
    });
  },

  // Analytics and stats
  async getMemberCount(): Promise<number> {
    return executeQuery(async () => {
      const { count, error } = await supabase
        .from("members")
        .select("*", { count: "exact", head: true });
      return { data: count, error };
    });
  },

  async getMemberCountByStatus(): Promise<Record<MemberStatus, number>> {
    return executeQuery(async () => {
      const { data, error } = await supabase
        .from("members")
        .select("status")
        .not("status", "is", null);

      const counts: Record<MemberStatus, number> = {
        active: 0,
        inactive: 0,
        suspended: 0,
        expired: 0,
        pending: 0,
      };

      data?.forEach((member: { status: MemberStatus }) => {
        counts[member.status] = (counts[member.status] || 0) + 1;
      });

      return { data: counts, error };
    });
  },

  async getNewMembersThisMonth(): Promise<Member[]> {
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    return executeQuery(async () => {
      return await supabase
        .from("members")
        .select("*")
        .gte("join_date", firstDayOfMonth.toISOString().split("T")[0])
        .order("join_date", { ascending: false });
    });
  },

  async checkEmailExists(email: string, excludeId?: string): Promise<boolean> {
    return executeQuery(async () => {
      let query = supabase
        .from("members")
        .select("id", { head: true })
        .eq("email", email.toLowerCase());

      if (excludeId) {
        query = query.neq("id", excludeId);
      }

      const { data, error } = await query;
      return { data: !!data, error };
    });
  },

  // Member with relations
  async getMemberWithSubscription(id: string): Promise<MemberWithSubscription> {
    return executeQuery(async () => {
      return await supabase
        .from("members")
        .select(
          `
          *,
          subscription:member_subscriptions(
            *,
            plan:subscription_plans(*)
          ),
          emergency_contacts:member_emergency_contacts(*)
        `
        )
        .eq("id", id)
        .single();
    });
  },
};

export const trainerUtils = {
  // Core CRUD operations
  async getTrainerById(id: string): Promise<Trainer> {
    return executeQuery(async () => {
      return await supabase.from("trainers").select("*").eq("id", id).single();
    });
  },

  async getTrainers(filters: TrainerFilters = {}): Promise<Trainer[]> {
    return executeQuery(async () => {
      let query = supabase
        .from("trainers")
        .select("*")
        .order("created_at", { ascending: false });

      // Apply search filter (searches user profile first_name, last_name)
      if (filters.search) {
        // Join with user_profiles to search names
        query = supabase
          .from("trainers")
          .select(
            `
            *,
            user_profile:user_profiles(first_name, last_name, email)
          `
          )
          .or(
            `user_profile.first_name.ilike.%${filters.search}%,user_profile.last_name.ilike.%${filters.search}%,user_profile.email.ilike.%${filters.search}%`,
            { foreignTable: "user_profiles" }
          )
          .order("created_at", { ascending: false });
      }

      // Apply status filter - assuming active/inactive based on business logic
      // Note: trainers table doesn't have status field, so we'll check is_accepting_new_clients
      if (filters.status) {
        if (filters.status === "active") {
          query = query.eq("is_accepting_new_clients", true);
        } else if (filters.status === "inactive") {
          query = query.eq("is_accepting_new_clients", false);
        }
      }

      // Apply specializations filter
      if (filters.specializations && filters.specializations.length > 0) {
        query = query.contains("specializations", filters.specializations);
      }

      // Apply accepting new clients filter
      if (filters.isAcceptingNewClients !== undefined) {
        query = query.eq(
          "is_accepting_new_clients",
          filters.isAcceptingNewClients
        );
      }

      // Apply years experience filters
      if (filters.yearsExperienceMin !== undefined) {
        query = query.gte("years_experience", filters.yearsExperienceMin);
      }
      if (filters.yearsExperienceMax !== undefined) {
        query = query.lte("years_experience", filters.yearsExperienceMax);
      }

      // Apply pagination
      if (filters.offset !== undefined) {
        query = query.range(
          filters.offset,
          filters.offset + (filters.limit || 50) - 1
        );
      } else if (filters.limit) {
        query = query.limit(filters.limit);
      }

      return query;
    });
  },

  async createTrainer(trainerData: CreateTrainerData): Promise<Trainer> {
    return executeQuery(async () => {
      // First create user profile
      const { data: userProfile, error: profileError } = await supabase
        .from("user_profiles")
        .insert({
          first_name: trainerData.first_name,
          last_name: trainerData.last_name,
          email: trainerData.email,
          phone: trainerData.phone,
          date_of_birth: trainerData.date_of_birth,
          profile_picture_url: trainerData.profile_picture_url,
          role: "trainer",
        })
        .select("*")
        .single();

      if (profileError || !userProfile) {
        throw new DatabaseError(
          "Failed to create user profile for trainer",
          profileError?.code,
          profileError
        );
      }

      // Then create trainer record
      return await supabase
        .from("trainers")
        .insert({
          id: userProfile.id, // Use same ID as user profile
          trainer_code: trainerData.trainer_code,
          hourly_rate: trainerData.hourly_rate,
          commission_rate: trainerData.commission_rate || 0.15, // Default 15%
          max_clients_per_session: trainerData.max_clients_per_session || 1,
          years_experience: trainerData.years_experience,
          certifications: trainerData.certifications || [],
          specializations: trainerData.specializations || [],
          languages: trainerData.languages || ["English"],
          availability: trainerData.availability || {},
          is_accepting_new_clients:
            trainerData.is_accepting_new_clients ?? true,
          emergency_contact: trainerData.emergency_contact,
          insurance_policy_number: trainerData.insurance_policy_number,
          background_check_date: trainerData.background_check_date,
          cpr_certification_expires: trainerData.cpr_certification_expires,
          notes: trainerData.notes,
        })
        .select("*")
        .single();
    });
  },

  async updateTrainer(
    id: string,
    trainerData: UpdateTrainerData
  ): Promise<Trainer> {
    return executeQuery(async () => {
      return await supabase
        .from("trainers")
        .update({
          ...trainerData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*")
        .single();
    });
  },

  async deleteTrainer(id: string): Promise<void> {
    await executeQuery(async () => {
      // First delete trainer record
      const { error: trainerError } = await supabase
        .from("trainers")
        .delete()
        .eq("id", id);

      if (trainerError) {
        throw new DatabaseError(
          "Failed to delete trainer",
          trainerError.code,
          trainerError
        );
      }

      // Then delete associated user profile
      const { data, error } = await supabase
        .from("user_profiles")
        .delete()
        .eq("id", id);

      return { data: data || null, error };
    });
  },

  // Search and filtering
  async searchTrainers(query: string): Promise<TrainerWithProfile[]> {
    if (!query || query.length < 2) {
      return [];
    }

    return executeQuery(async () => {
      return await supabase
        .from("trainers")
        .select(
          `
          *,
          user_profile:user_profiles(*)
        `
        )
        .or(
          `user_profile.first_name.ilike.%${query}%,user_profile.last_name.ilike.%${query}%,user_profile.email.ilike.%${query}%`,
          { foreignTable: "user_profiles" }
        )
        .order("created_at", { ascending: false })
        .limit(20);
    });
  },

  // Analytics and stats
  async getTrainerCount(): Promise<number> {
    return executeQuery(async () => {
      const { count, error } = await supabase
        .from("trainers")
        .select("*", { count: "exact", head: true });
      return { data: count, error };
    });
  },

  async getTrainerCountByStatus(): Promise<{
    active: number;
    inactive: number;
  }> {
    return executeQuery(async () => {
      const { data, error } = await supabase
        .from("trainers")
        .select("is_accepting_new_clients");

      const counts = { active: 0, inactive: 0 };

      data?.forEach((trainer: { is_accepting_new_clients: boolean }) => {
        if (trainer.is_accepting_new_clients) {
          counts.active += 1;
        } else {
          counts.inactive += 1;
        }
      });

      return { data: counts, error };
    });
  },

  async getTrainersBySpecialization(
    specialization: string
  ): Promise<Trainer[]> {
    return executeQuery(async () => {
      return await supabase
        .from("trainers")
        .select("*")
        .contains("specializations", [specialization])
        .order("created_at", { ascending: false });
    });
  },

  async getAvailableTrainers(): Promise<Trainer[]> {
    return executeQuery(async () => {
      return await supabase
        .from("trainers")
        .select("*")
        .eq("is_accepting_new_clients", true)
        .order("created_at", { ascending: false });
    });
  },

  async getTrainersWithExpiringCerts(days = 30): Promise<Trainer[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return executeQuery(async () => {
      return await supabase
        .from("trainers")
        .select("*")
        .lte(
          "cpr_certification_expires",
          futureDate.toISOString().split("T")[0]
        )
        .not("cpr_certification_expires", "is", null)
        .order("cpr_certification_expires", { ascending: true });
    });
  },

  // Trainer with relations
  async getTrainerWithProfile(id: string): Promise<TrainerWithProfile> {
    return executeQuery(async () => {
      return await supabase
        .from("trainers")
        .select(
          `
          *,
          user_profile:user_profiles(*),
          specializations_details:trainer_specializations(
            id,
            name,
            description,
            certification_required
          )
        `
        )
        .eq("id", id)
        .single();
    });
  },

  // Bulk operations
  async bulkUpdateAcceptingClients(
    trainerIds: string[],
    isAccepting: boolean
  ): Promise<Trainer[]> {
    return executeQuery(async () => {
      return await supabase
        .from("trainers")
        .update({
          is_accepting_new_clients: isAccepting,
          updated_at: new Date().toISOString(),
        })
        .in("id", trainerIds)
        .select("*");
    });
  },

  async checkTrainerCodeExists(
    trainerCode: string,
    excludeId?: string
  ): Promise<boolean> {
    return executeQuery(async () => {
      let query = supabase
        .from("trainers")
        .select("id", { head: true })
        .eq("trainer_code", trainerCode);

      if (excludeId) {
        query = query.neq("id", excludeId);
      }

      const { data, error } = await query;
      return { data: !!data, error };
    });
  },
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
    const { error } = await supabase
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
  trainers: trainerUtils,
  equipment: equipmentUtils,
  classes: classUtils,
  testConnection: testDatabaseConnection,
};
