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

// Enhanced member utilities for TanStack Query integration
export interface MemberFilters {
  status?: MemberStatus | MemberStatus[];
  search?: string;
  joinDateFrom?: string;
  joinDateTo?: string;
  limit?: number;
  offset?: number;
  // NEW: Server-side sorting support
  orderBy?: "name" | "email" | "status" | "join_date" | "phone";
  orderDirection?: "asc" | "desc";
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
  // NEW: Server-side sorting support
  orderBy?:
    | "name"
    | "email"
    | "hourly_rate"
    | "years_experience"
    | "is_accepting_new_clients";
  orderDirection?: "asc" | "desc";
}

export interface CreateTrainerData {
  // Trainer-specific data
  date_of_birth?: string;
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
}

export interface UpdateTrainerData {
  // User profile fields
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  // Trainer-specific fields
  date_of_birth?: string;
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
      let query = supabase.from("members").select("*");

      // Apply server-side sorting
      if (filters.orderBy) {
        const ascending = filters.orderDirection === "asc";
        switch (filters.orderBy) {
          case "name":
            // Sort by concatenated first_name + last_name
            query = query
              .order("first_name", { ascending })
              .order("last_name", { ascending });
            break;
          case "email":
            query = query.order("email", { ascending });
            break;
          case "status":
            query = query.order("status", { ascending });
            break;
          case "join_date":
            query = query.order("join_date", { ascending });
            break;
          case "phone":
            query = query.order("phone", { ascending });
            break;
          default:
            query = query.order("created_at", { ascending: false });
        }
      } else {
        // Default sorting if no orderBy specified
        query = query.order("created_at", { ascending: false });
      }

      // Apply status filter
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          query = query.in("status", filters.status);
        } else {
          query = query.eq("status", filters.status);
        }
      }

      // Apply search filter (searches first_name, last_name only)
      if (filters.search) {
        query = query.or(
          `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`
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
    await validateAdminAccess();
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
    await executeQuery(
      async () => {
        const { data, error } = await supabase
          .from("members")
          .delete()
          .eq("id", id);
        return { data: data || null, error };
      },
      { allowNullData: true }
    );
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
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
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
  // Helper method to convert specialization UUIDs to names
  async convertSpecializationUuidsToNames(
    trainers: Trainer[]
  ): Promise<Trainer[]> {
    if (!trainers || trainers.length === 0) {
      return trainers;
    }

    // Extract all unique specialization UUIDs from all trainers
    const allSpecializationUuids = new Set<string>();
    trainers.forEach((trainer) => {
      if (trainer.specializations && Array.isArray(trainer.specializations)) {
        trainer.specializations.forEach((uuid) => {
          if (
            typeof uuid === "string" &&
            uuid.match(
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            )
          ) {
            allSpecializationUuids.add(uuid);
          }
        });
      }
    });

    if (allSpecializationUuids.size === 0) {
      return trainers;
    }

    // Fetch specialization names in one batch
    const { data: specializations, error } = await supabase
      .from("trainer_specializations")
      .select("id, name")
      .in("id", Array.from(allSpecializationUuids));

    if (error) {
      console.error("Failed to fetch specialization names:", error);
      return trainers; // Return trainers with UUIDs if fetch fails
    }

    // Create UUID to name mapping
    const uuidToNameMap = new Map<string, string>();
    specializations?.forEach((spec) => {
      uuidToNameMap.set(spec.id, spec.name);
    });

    // Convert UUIDs to names for each trainer
    return trainers.map((trainer) => ({
      ...trainer,
      specializations:
        trainer.specializations?.map(
          (uuid) => uuidToNameMap.get(uuid) || uuid // Fallback to UUID if name not found
        ) || [],
    }));
  },

  // Core CRUD operations
  async getTrainerById(id: string): Promise<Trainer> {
    return executeQuery(async () => {
      return await supabase.from("trainers").select("*").eq("id", id).single();
    });
  },

  async getTrainers(filters: TrainerFilters = {}): Promise<Trainer[]> {
    const result = await executeQuery(async () => {
      // When search filter is provided, use user_profiles query approach (like searchTrainers)
      if (filters.search) {
        let query = supabase
          .from("user_profiles")
          .select(
            `
            id,
            role,
            email,
            first_name,
            last_name,
            phone,
            avatar_url,
            bio,
            hire_date,
            is_active,
            created_at,
            updated_at,
            trainers(*)
          `
          )
          .eq("role", "trainer")
          .or(
            `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`
          );
        // Apply server-side sorting for search path
        if (filters.orderBy) {
          const ascending = filters.orderDirection === "asc";
          switch (filters.orderBy) {
            case "name":
              query = query
                .order("first_name", { ascending })
                .order("last_name", { ascending });
              break;
            case "email":
              query = query.order("email", { ascending });
              break;
            default:
              query = query.order("created_at", { ascending: false });
          }
        } else {
          query = query.order("created_at", { ascending: false });
        }

        // Apply pagination for user_profiles query
        if (filters.offset !== undefined) {
          query = query.range(
            filters.offset,
            filters.offset + (filters.limit || 50) - 1
          );
        } else if (filters.limit) {
          query = query.limit(filters.limit);
        }

        const { data, error } = await query;
        if (error || !data) return { data: null, error };

        // Transform to match expected Trainer[] structure and filter by other conditions
        let trainersWithProfile = data
          .map((profile) => {
            // Handle different trainer data formats from PostgREST
            const trainerData = Array.isArray(profile.trainers)
              ? profile.trainers[0]
              : profile.trainers;

            // Skip if no trainer data exists
            if (!trainerData || !trainerData.id) {
              return null;
            }

            return {
              ...trainerData,
              user_profile: {
                id: profile.id,
                role: profile.role,
                email: profile.email,
                first_name: profile.first_name,
                last_name: profile.last_name,
                phone: profile.phone,
                avatar_url: profile.avatar_url,
                bio: profile.bio,
                hire_date: profile.hire_date,
                is_active: profile.is_active,
                created_at: profile.created_at,
                updated_at: profile.updated_at,
              },
            };
          })
          .filter((trainer) => trainer && trainer.id); // Filter out null results and profiles without trainer records

        // Apply remaining filters on the results
        if (filters.status) {
          if (filters.status === "active") {
            trainersWithProfile = trainersWithProfile.filter(
              (t) => t.is_accepting_new_clients === true
            );
          } else if (filters.status === "inactive") {
            trainersWithProfile = trainersWithProfile.filter(
              (t) => t.is_accepting_new_clients === false
            );
          }
        }

        if (filters.specializations && filters.specializations.length > 0) {
          trainersWithProfile = trainersWithProfile.filter(
            (t) =>
              t.specializations &&
              t.specializations.some((spec: string) =>
                filters.specializations!.includes(spec)
              )
          );
        }

        if (filters.isAcceptingNewClients !== undefined) {
          trainersWithProfile = trainersWithProfile.filter(
            (t) => t.is_accepting_new_clients === filters.isAcceptingNewClients
          );
        }

        if (filters.yearsExperienceMin !== undefined) {
          trainersWithProfile = trainersWithProfile.filter(
            (t) => (t.years_experience || 0) >= filters.yearsExperienceMin!
          );
        }

        if (filters.yearsExperienceMax !== undefined) {
          trainersWithProfile = trainersWithProfile.filter(
            (t) => (t.years_experience || 0) <= filters.yearsExperienceMax!
          );
        }

        return { data: trainersWithProfile, error: null };
      }

      // When no search filter, use efficient trainers table query
      let query = supabase.from("trainers").select(
        `
          *,
          user_profile:user_profiles(first_name, last_name, email, phone, avatar_url, bio)
        `
      );

      // Apply server-side sorting for regular path
      if (filters.orderBy) {
        const ascending = filters.orderDirection === "asc";
        switch (filters.orderBy) {
          case "name":
            // For trainers, we need to sort by user_profile fields
            // Note: This might require adjustment based on PostgREST capabilities
            query = query
              .order("user_profile.first_name", { ascending })
              .order("user_profile.last_name", { ascending });
            break;
          case "email":
            query = query.order("user_profile.email", { ascending });
            break;
          case "hourly_rate":
            query = query.order("hourly_rate", { ascending });
            break;
          case "years_experience":
            query = query.order("years_experience", { ascending });
            break;
          case "is_accepting_new_clients":
            query = query.order("is_accepting_new_clients", { ascending });
            break;
          default:
            query = query.order("created_at", { ascending: false });
        }
      } else {
        query = query.order("created_at", { ascending: false });
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
        query = query.overlaps("specializations", filters.specializations);
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

    // Post-process to convert specialization UUIDs to names
    return this.convertSpecializationUuidsToNames(result);
  },

  async createTrainer(trainerData: CreateTrainerData): Promise<Trainer> {
    await validateAdminAccess();
    return executeQuery(async () => {
      // Use the atomic database function for trainer creation
      const { data: result, error } = await supabase.rpc(
        "create_trainer_with_profile",
        {
          p_first_name: trainerData.first_name,
          p_last_name: trainerData.last_name,
          p_email: trainerData.email,
          p_phone: trainerData.phone || null,
          p_date_of_birth: trainerData.date_of_birth || null,
          p_hourly_rate: trainerData.hourly_rate || null,
          p_commission_rate: trainerData.commission_rate || 0.15,
          p_max_clients_per_session: trainerData.max_clients_per_session || 1,
          p_years_experience: trainerData.years_experience || null,
          p_certifications: trainerData.certifications || [],
          p_specializations: trainerData.specializations || [],
          p_languages: trainerData.languages || ["English"],
          p_availability: trainerData.availability || {},
          p_is_accepting_new_clients:
            trainerData.is_accepting_new_clients ?? true,
          p_emergency_contact: trainerData.emergency_contact || null,
          p_insurance_policy_number:
            trainerData.insurance_policy_number || null,
          p_background_check_date: trainerData.background_check_date || null,
          p_cpr_certification_expires:
            trainerData.cpr_certification_expires || null,
          p_notes: trainerData.notes || null,
        }
      );

      if (error) {
        throw new DatabaseError(
          error.message || "Failed to create trainer",
          error.code,
          error
        );
      }

      if (!result) {
        throw new DatabaseError("No data returned from trainer creation");
      }

      // The function returns JSON with both trainer and user_profile
      // Return just the trainer portion to maintain interface compatibility
      return { data: result.trainer, error: null };
    });
  },

  async updateTrainer(
    id: string,
    trainerData: UpdateTrainerData
  ): Promise<Trainer> {
    return executeQuery(async () => {
      // Separate user profile fields from trainer fields
      const { first_name, last_name, email, phone, ...trainerFields } =
        trainerData;

      // Update user profile if any profile fields are provided
      if (first_name || last_name || email || phone) {
        const profileUpdate: Record<string, unknown> = {};
        if (first_name !== undefined) profileUpdate.first_name = first_name;
        if (last_name !== undefined) profileUpdate.last_name = last_name;
        if (email !== undefined) profileUpdate.email = email;
        if (phone !== undefined) profileUpdate.phone = phone;
        profileUpdate.updated_at = new Date().toISOString();

        const { error: profileError } = await supabase
          .from("user_profiles")
          .update(profileUpdate)
          .eq("id", id);

        if (profileError) {
          throw new DatabaseError(
            "Failed to update trainer profile information",
            profileError.code,
            profileError
          );
        }
      }

      // Update trainer record (including date_of_birth)
      return await supabase
        .from("trainers")
        .update({
          ...trainerFields,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*")
        .single();
    });
  },

  async deleteTrainer(id: string): Promise<void> {
    await executeQuery(
      async () => {
        // First delete associated classes
        const { error: classesError } = await supabase
          .from("classes")
          .delete()
          .eq("trainer_id", id);

        if (classesError) {
          throw new DatabaseError(
            "Failed to delete trainer classes",
            classesError.code,
            classesError
          );
        }

        // Then delete associated trainer sessions
        const { error: sessionsError } = await supabase
          .from("trainer_sessions")
          .delete()
          .eq("trainer_id", id);

        if (sessionsError) {
          throw new DatabaseError(
            "Failed to delete trainer sessions",
            sessionsError.code,
            sessionsError
          );
        }

        // Then delete trainer record
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

        // Finally delete associated user profile
        const { data, error } = await supabase
          .from("user_profiles")
          .delete()
          .eq("id", id);

        return { data: data || null, error };
      },
      { allowNullData: true }
    );
  },

  // Search and filtering
  async searchTrainers(query: string): Promise<TrainerWithProfile[]> {
    if (!query || query.length < 2) {
      return [];
    }

    return executeQuery(async () => {
      return await supabase
        .from("user_profiles")
        .select(
          `
          id,
          role,
          email,
          first_name,
          last_name,
          phone,
          avatar_url,
          bio,
          hire_date,
          is_active,
          created_at,
          updated_at,
          trainers(*)
        `
        )
        .eq("role", "trainer")
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .order("created_at", { ascending: false })
        .limit(20)
        .then(({ data, error }) => {
          if (error || !data) return { data: null, error };

          // Transform to match TrainerWithProfile interface
          const trainersWithProfile = data
            .map((profile) => ({
              ...profile.trainers[0],
              user_profile: {
                id: profile.id,
                role: profile.role,
                email: profile.email,
                first_name: profile.first_name,
                last_name: profile.last_name,
                phone: profile.phone,
                avatar_url: profile.avatar_url,
                bio: profile.bio,
                hire_date: profile.hire_date,
                is_active: profile.is_active,
                created_at: profile.created_at,
                updated_at: profile.updated_at,
              },
            }))
            .filter((trainer) => trainer.id); // Filter out profiles without trainer records

          return { data: trainersWithProfile, error: null };
        });
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
    // First get the trainer with user profile
    const trainerResult = await supabase
      .from("trainers")
      .select(
        `
        *,
        user_profile:user_profiles(*)
      `
      )
      .eq("id", id)
      .single();

    if (trainerResult.error) {
      throw new DatabaseError(
        trainerResult.error.message || "Failed to fetch trainer",
        trainerResult.error.code,
        trainerResult.error.details
      );
    }

    if (!trainerResult.data) {
      throw new DatabaseError("No trainer found with the provided ID");
    }

    const trainer = trainerResult.data;

    // Convert specialization UUIDs to names
    const trainersWithConvertedSpecs =
      await this.convertSpecializationUuidsToNames([trainer]);
    const trainerWithConvertedSpecs = trainersWithConvertedSpecs[0];

    // Then get specializations details if trainer has specializations
    let specializations_details: TrainerSpecialization[] = [];
    if (trainer.specializations && trainer.specializations.length > 0) {
      const specializationsResult = await supabase
        .from("trainer_specializations")
        .select("id, name, description, certification_required, created_at")
        .in("id", trainer.specializations);

      if (specializationsResult.error) {
        throw new DatabaseError(
          specializationsResult.error.message ||
            "Failed to fetch specializations",
          specializationsResult.error.code,
          specializationsResult.error.details
        );
      }
      specializations_details = specializationsResult.data || [];
    }

    return {
      ...trainerWithConvertedSpecs,
      specializations_details,
    };
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

  // Cleanup utility for orphaned trainer profiles
  async cleanupOrphanedTrainerProfiles(): Promise<{
    orphanedCount: number;
    cleanedUpIds: string[];
  }> {
    await validateAdminAccess();
    return executeQuery(async () => {
      // First, identify orphaned user_profiles with role='trainer' that don't have corresponding trainer records
      const { data: orphanedProfiles, error: selectError } = await supabase
        .from("user_profiles")
        .select("id, email, first_name, last_name")
        .eq("role", "trainer")
        .not("id", "in", `(SELECT id FROM trainers)`);

      if (selectError) {
        throw new DatabaseError(
          "Failed to identify orphaned trainer profiles",
          selectError.code,
          selectError
        );
      }

      if (!orphanedProfiles || orphanedProfiles.length === 0) {
        return { data: { orphanedCount: 0, cleanedUpIds: [] }, error: null };
      }

      const orphanedIds = orphanedProfiles.map((profile) => profile.id);

      // Delete the orphaned profiles
      const { error: deleteError } = await supabase
        .from("user_profiles")
        .delete()
        .in("id", orphanedIds);

      if (deleteError) {
        throw new DatabaseError(
          "Failed to clean up orphaned trainer profiles",
          deleteError.code,
          deleteError
        );
      }

      return {
        data: {
          orphanedCount: orphanedProfiles.length,
          cleanedUpIds: orphanedIds,
        },
        error: null,
      };
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
