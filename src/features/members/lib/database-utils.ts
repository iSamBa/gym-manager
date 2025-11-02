// Member database operations and utilities
import { supabase } from "@/lib/supabase";
import {
  executeQuery,
  validateAdminAccess,
} from "@/features/database/lib/query-helpers";
import type {
  Member,
  MemberStatus,
  MemberType,
  Gender,
  Address,
  MemberWithSubscription,
  MemberWithEnhancedDetails,
} from "@/features/database/lib/types";
import {
  formatForDatabase,
  formatTimestampForDatabase,
  getLocalDateString,
} from "@/lib/date-utils";

// Enhanced member filters with new capabilities (US-002)
export interface MemberFilters {
  // Existing filters
  status?: MemberStatus | MemberStatus[];
  search?: string;
  joinDateFrom?: string;
  joinDateTo?: string;
  limit?: number;
  offset?: number;
  orderBy?: "name" | "email" | "status" | "join_date" | "phone";
  orderDirection?: "asc" | "desc";

  // NEW: Enhanced filters (US-002)
  /** Filter members with active subscriptions */
  hasActiveSubscription?: boolean;
  /** Filter members with upcoming sessions */
  hasUpcomingSessions?: boolean;
  /** Filter members with outstanding balance */
  hasOutstandingBalance?: boolean;
  /** Filter by member type */
  memberType?: MemberType;
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
  // US-001: Equipment & Referral Tracking fields
  uniform_size?: string;
  uniform_received?: boolean;
  vest_size?: string;
  hip_belt_size?: string;
  referral_source?: string;
  referred_by_member_id?: string;
  training_preference?: string;
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
  // US-001: Equipment & Referral Tracking fields
  uniform_size?: string;
  uniform_received?: boolean;
  vest_size?: string;
  hip_belt_size?: string;
  referral_source?: string;
  referred_by_member_id?: string;
  training_preference?: string;
}

/**
 * Internal type for database function response
 * Matches the flat structure returned by get_members_with_details()
 */
interface DatabaseMemberRow {
  // Member fields
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  status: MemberStatus;
  join_date: string;
  member_type: string;
  profile_picture_url: string | null;
  address: Address | null;
  notes: string | null;
  medical_conditions: string | null;
  fitness_goals: string | null;
  preferred_contact_method: string | null;
  marketing_consent: boolean;
  waiver_signed: boolean;
  waiver_signed_date: string | null;
  created_at: string;
  updated_at: string;

  // Subscription fields (flat)
  subscription_end_date: string | null;
  remaining_sessions: number | null;
  balance_due: number | null;

  // Session fields (flat)
  last_session_date: string | null;
  next_session_date: string | null;
  scheduled_sessions_count: number | null;

  // Payment fields
  last_payment_date: string | null;
}

export const memberUtils = {
  // Core CRUD operations
  async getMemberById(id: string): Promise<Member> {
    return executeQuery(async () => {
      return await supabase.from("members").select("*").eq("id", id).single();
    });
  },

  /**
   * Get members with enhanced details (subscription, sessions, payments)
   * Uses database function for optimal performance
   */
  async getMembers(
    filters: MemberFilters = {}
  ): Promise<MemberWithEnhancedDetails[]> {
    try {
      // Build RPC call to database function
      const { data, error } = await supabase.rpc("get_members_with_details", {
        p_status: filters.status
          ? Array.isArray(filters.status)
            ? filters.status
            : [filters.status]
          : null,
        p_search: filters.search || null,
        p_member_type: filters.memberType || null,
        p_has_active_subscription: filters.hasActiveSubscription ?? null,
        p_has_upcoming_sessions: filters.hasUpcomingSessions ?? null,
        p_has_outstanding_balance: filters.hasOutstandingBalance ?? null,
        p_limit: filters.limit ?? 20, // Default page size for pagination
        p_offset: filters.offset ?? 0,
        p_order_by: filters.orderBy ?? "name",
        p_order_direction: filters.orderDirection ?? "asc",
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        return [];
      }

      // Transform flat database response to nested structure
      return data.map((row: DatabaseMemberRow) => ({
        // Base member fields
        id: row.id,
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
        phone: row.phone,
        date_of_birth: row.date_of_birth,
        gender: row.gender,
        status: row.status,
        join_date: row.join_date,
        member_type: row.member_type,
        profile_picture_url: row.profile_picture_url,
        address: row.address,
        notes: row.notes,
        medical_conditions: row.medical_conditions,
        fitness_goals: row.fitness_goals,
        preferred_contact_method: row.preferred_contact_method,
        marketing_consent: row.marketing_consent,
        waiver_signed: row.waiver_signed,
        waiver_signed_date: row.waiver_signed_date,
        created_at: row.created_at,
        updated_at: row.updated_at,

        // Enhanced fields - nest subscription data
        active_subscription: row.subscription_end_date
          ? {
              end_date: row.subscription_end_date,
              remaining_sessions: row.remaining_sessions ?? 0,
              balance_due: row.balance_due ?? 0,
            }
          : null,

        // Enhanced fields - nest session stats
        session_stats:
          row.last_session_date ||
          row.next_session_date ||
          row.scheduled_sessions_count
            ? {
                last_session_date: row.last_session_date,
                next_session_date: row.next_session_date,
                scheduled_sessions_count: row.scheduled_sessions_count ?? 0,
              }
            : null,

        // Enhanced fields - payment info
        last_payment_date: row.last_payment_date,
      }));
    } catch (error) {
      console.error("Failed to fetch enhanced members:", error);
      throw error;
    }
  },

  async createMember(memberData: CreateMemberData): Promise<Member> {
    await validateAdminAccess();

    /**
     * Data Cleaning: Empty String → NULL conversion
     * See updateMember() for detailed explanation of why this is done
     * at the database layer instead of in Zod validation.
     */
    const cleanedData: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(memberData)) {
      // Skip undefined values
      if (value === undefined) continue;

      // Convert empty strings to null for optional text fields
      if (
        value === "" &&
        (key === "phone" ||
          key === "notes" ||
          key === "medical_conditions" ||
          key === "fitness_goals" ||
          key === "profile_picture_url")
      ) {
        cleanedData[key] = null;
      } else {
        cleanedData[key] = value;
      }
    }

    return executeQuery(async () => {
      return await supabase
        .from("members")
        .insert({
          ...cleanedData,
          status: memberData.status || "active",
          join_date: memberData.join_date || formatForDatabase(new Date()),
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
    /**
     * Data Cleaning: Empty String → NULL conversion
     *
     * WHY HERE AND NOT IN ZOD?
     * - This is a database compatibility concern, not a validation concern
     * - Zod validates: "Is this a valid string?" ✅ "" is valid
     * - Database expects: NULL for optional fields, not empty strings
     * - Using z.preprocess() breaks TypeScript type inference (types become 'unknown')
     * - Keeping data transformation at the DB layer is cleaner and more maintainable
     *
     * WHAT IT DOES:
     * Converts empty strings ("") to null for optional text fields to match
     * PostgreSQL's expectation. Prevents "malformed array literal" errors.
     */
    const cleanedData: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(memberData)) {
      // Skip undefined values
      if (value === undefined) continue;

      // Convert empty strings to null for optional text fields
      if (
        value === "" &&
        (key === "phone" ||
          key === "notes" ||
          key === "medical_conditions" ||
          key === "fitness_goals" ||
          key === "profile_picture_url")
      ) {
        cleanedData[key] = null;
      } else {
        cleanedData[key] = value;
      }
    }

    return executeQuery(async () => {
      return await supabase
        .from("members")
        .update({
          ...cleanedData,
          updated_at: formatTimestampForDatabase(new Date()),
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
          updated_at: formatTimestampForDatabase(new Date()),
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
        .or(
          `first_name.ilike.${query.trim().toLowerCase()}%,last_name.ilike.${query.trim().toLowerCase()}%,email.ilike.%${query.trim().toLowerCase()}%,phone.ilike.%${query.trim().toLowerCase()}%`
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
          updated_at: formatTimestampForDatabase(new Date()),
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

    return executeQuery(async () => {
      return await supabase
        .from("members")
        .select("*")
        .gte("join_date", getLocalDateString(firstDayOfMonth))
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
    const result = await executeQuery(async () => {
      return await supabase
        .from("members")
        .select(
          `
          *,
          subscriptions:member_subscriptions(
            *,
            plan:subscription_plans(*)
          )
        `
        )
        .eq("id", id)
        .single();
    });

    // Transform the data: get the first active subscription
    if (!result) {
      throw new Error("Member not found");
    }

    const memberData = result as Member & {
      subscriptions?: Array<{ status: string }>;
    };
    const activeSubscription =
      memberData.subscriptions?.find((sub) => sub.status === "active") || null;

    // Fetch the last payment date for this member
    const { data: lastPaymentData } = await supabase
      .from("subscription_payments")
      .select("payment_date")
      .eq("member_id", id)
      .not("payment_date", "is", null)
      .order("payment_date", { ascending: false })
      .limit(1);

    const lastPayment = lastPaymentData?.[0] || null;

    return {
      ...(result as Member),
      subscription: activeSubscription,
      last_payment_date: lastPayment?.payment_date || null,
    } as MemberWithSubscription;
  },
};
