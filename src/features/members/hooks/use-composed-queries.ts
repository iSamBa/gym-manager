import { useQueries, useQuery } from "@tanstack/react-query";
import { memberUtils } from "@/features/database/lib/utils";
import type { Member } from "@/features/database/lib/types";
import { memberKeys } from "./use-members";

// Composed data interfaces
export interface MemberWithRelations extends Member {
  subscription?: {
    id: string;
    plan_name: string;
    status: string;
    start_date: string;
    end_date?: string;
    monthly_fee: number;
  };
  emergency_contacts?: Array<{
    id: string;
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  }>;
  recent_visits?: Array<{
    date: string;
    duration?: number;
    check_in: string;
    check_out?: string;
  }>;
}

export interface MemberAnalytics extends Member {
  analytics: {
    total_visits: number;
    average_visit_duration: number; // minutes
    last_visit?: string;
    membership_duration_days: number;
    payment_history_count: number;
    total_payments: number;
    compliance_score: number; // 0-100
    engagement_level: "low" | "medium" | "high";
    risk_score: number; // 0-100, higher = more likely to churn
  };
}

export interface MemberDashboardData {
  member: Member;
  subscription?: MemberWithRelations["subscription"];
  recent_activity: {
    visits: number;
    last_visit?: string;
    upcoming_classes: number;
  };
  financial: {
    current_balance: number;
    last_payment?: {
      amount: number;
      date: string;
      method: string;
    };
    next_payment_due?: string;
  };
  alerts: Array<{
    type: "warning" | "info" | "error";
    message: string;
    severity: number;
  }>;
}

// Hook for member with all related data
export function useMemberWithRelations(
  memberId: string,
  options: {
    includeSubscription?: boolean;
    includeEmergencyContacts?: boolean;
    includeRecentVisits?: boolean;
    enabled?: boolean;
  } = {}
) {
  const {
    includeSubscription = true,
    includeEmergencyContacts = true,
    includeRecentVisits = true,
    enabled = true,
  } = options;

  return useQuery({
    queryKey: [
      ...memberKeys.withSubscription(memberId),
      "full-relations",
      { includeSubscription, includeEmergencyContacts, includeRecentVisits },
    ],
    queryFn: async (): Promise<MemberWithRelations | null> => {
      if (!enabled) return null;

      // Get base member data
      const member = await memberUtils.getMemberById(memberId);
      if (!member) return null;

      const memberWithRelations: MemberWithRelations = { ...member };

      // Fetch related data in parallel
      const fetchPromises: Promise<any>[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any

      if (includeSubscription) {
        fetchPromises.push(
          // This would be a real subscription query
          Promise.resolve(null).then(() => ({
            id: `sub_${memberId}`,
            plan_name: "Premium",
            status: "active",
            start_date: "2024-01-01",
            monthly_fee: 59.99,
          }))
        );
      } else {
        fetchPromises.push(Promise.resolve(null));
      }

      if (includeEmergencyContacts) {
        fetchPromises.push(
          // This would be a real emergency contacts query
          Promise.resolve([
            {
              id: `ec_${memberId}_1`,
              name: "Emergency Contact",
              relationship: "Spouse",
              phone: "+1-555-0123",
              email: "emergency@example.com",
            },
          ])
        );
      } else {
        fetchPromises.push(Promise.resolve([]));
      }

      if (includeRecentVisits) {
        fetchPromises.push(
          // This would be a real visits query
          Promise.resolve([
            {
              date: new Date().toISOString().split("T")[0],
              duration: 90,
              check_in: "09:00",
              check_out: "10:30",
            },
          ])
        );
      } else {
        fetchPromises.push(Promise.resolve([]));
      }

      const [subscription, emergencyContacts, recentVisits] =
        await Promise.all(fetchPromises);

      if (subscription) memberWithRelations.subscription = subscription;
      if (emergencyContacts)
        memberWithRelations.emergency_contacts = emergencyContacts;
      if (recentVisits) memberWithRelations.recent_visits = recentVisits;

      return memberWithRelations;
    },
    enabled: enabled && !!memberId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for member with computed analytics
export function useMemberAnalytics(memberId: string, enabled = true) {
  return useQuery({
    queryKey: [...memberKeys.detail(memberId), "analytics"],
    queryFn: async (): Promise<MemberAnalytics | null> => {
      // Get base member data
      const member = await memberUtils.getMemberById(memberId);
      if (!member) return null;

      // Calculate analytics (in a real app, this would query analytics tables)
      const joinDate = new Date(member.join_date || member.created_at);
      const membershipDurationDays = Math.floor(
        (Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Simulated analytics data
      const analytics = {
        total_visits: Math.floor(Math.random() * 200) + 50,
        average_visit_duration: Math.floor(Math.random() * 120) + 30,
        last_visit: new Date(
          Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        membership_duration_days: membershipDurationDays,
        payment_history_count: Math.floor(membershipDurationDays / 30),
        total_payments: Math.floor(membershipDurationDays / 30) * 59.99,
        compliance_score: Math.floor(Math.random() * 40) + 60, // 60-100
        engagement_level: (["low", "medium", "high"] as const)[
          Math.floor(Math.random() * 3)
        ],
        risk_score: Math.floor(Math.random() * 50), // 0-50, lower is better
      };

      return {
        ...member,
        analytics,
      };
    },
    enabled: enabled && !!memberId,
    staleTime: 30 * 60 * 1000, // 30 minutes for analytics
  });
}

// Hook for comprehensive member dashboard data
export function useMemberDashboard(memberId: string, enabled = true) {
  return useQuery({
    queryKey: [...memberKeys.detail(memberId), "dashboard"],
    queryFn: async (): Promise<MemberDashboardData | null> => {
      // Get base member data
      const member = await memberUtils.getMemberById(memberId);
      if (!member) return null;

      // Fetch dashboard data in parallel
      const [subscription, recentActivity, financialData] = await Promise.all([
        // Subscription data
        Promise.resolve({
          id: `sub_${memberId}`,
          plan_name: "Premium",
          status: "active",
          start_date: "2024-01-01",
          monthly_fee: 59.99,
        }),

        // Recent activity
        Promise.resolve({
          visits: Math.floor(Math.random() * 20) + 5,
          last_visit: new Date(
            Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
          upcoming_classes: Math.floor(Math.random() * 5),
        }),

        // Financial data
        Promise.resolve({
          current_balance: Math.random() > 0.8 ? Math.random() * 100 : 0,
          last_payment: {
            amount: 59.99,
            date: new Date(
              Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            method: "Credit Card",
          },
          next_payment_due: new Date(
            Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
        }),
      ]);

      // Generate alerts based on member data
      const alerts: MemberDashboardData["alerts"] = [];

      if (member.status === "suspended") {
        alerts.push({
          type: "warning",
          message: "Member account is suspended",
          severity: 8,
        });
      }

      if (financialData.current_balance > 0) {
        alerts.push({
          type: "error",
          message: `Outstanding balance: $${financialData.current_balance.toFixed(2)}`,
          severity: 7,
        });
      }

      if (!member.waiver_signed) {
        alerts.push({
          type: "warning",
          message: "Waiver not signed",
          severity: 6,
        });
      }

      // Sort alerts by severity (highest first)
      alerts.sort((a, b) => b.severity - a.severity);

      return {
        member,
        subscription,
        recent_activity: recentActivity,
        financial: financialData,
        alerts,
      };
    },
    enabled: enabled && !!memberId,
    staleTime: 5 * 60 * 1000, // 5 minutes for dashboard data
  });
}

// Hook for dependent queries (member -> subscription -> payment history)
export function useDependentMemberQueries(memberId: string, enabled = true) {
  // First, get the member
  const memberQuery = useQuery({
    queryKey: memberKeys.detail(memberId),
    queryFn: () => memberUtils.getMemberById(memberId),
    enabled: enabled && !!memberId,
    staleTime: 10 * 60 * 1000,
  });

  // Then get subscription (depends on member existing)
  const subscriptionQuery = useQuery({
    queryKey: ["subscription", memberId],
    queryFn: async () => {
      // This would be a real subscription query
      return {
        id: `sub_${memberId}`,
        member_id: memberId,
        plan_name: "Premium",
        status: "active",
        start_date: "2024-01-01",
        monthly_fee: 59.99,
      };
    },
    enabled: !!memberQuery.data && !memberQuery.isError,
    staleTime: 10 * 60 * 1000,
  });

  // Finally get payment history (depends on subscription existing)
  const paymentHistoryQuery = useQuery({
    queryKey: ["payment-history", subscriptionQuery.data?.id],
    queryFn: async () => {
      // This would be a real payment history query
      const payments = [];
      const subscriptionStart = new Date("2024-01-01");
      const now = new Date();
      const monthsDiff = Math.floor(
        (now.getTime() - subscriptionStart.getTime()) /
          (1000 * 60 * 60 * 24 * 30)
      );

      for (let i = 0; i < monthsDiff; i++) {
        const paymentDate = new Date(subscriptionStart);
        paymentDate.setMonth(paymentDate.getMonth() + i);

        payments.push({
          id: `pay_${i}`,
          subscription_id: subscriptionQuery.data?.id,
          amount: subscriptionQuery.data?.monthly_fee || 59.99,
          date: paymentDate.toISOString(),
          status: Math.random() > 0.1 ? "completed" : "pending",
          method: "Credit Card",
        });
      }

      return payments;
    },
    enabled: !!subscriptionQuery.data && !subscriptionQuery.isError,
    staleTime: 15 * 60 * 1000,
  });

  return {
    member: memberQuery,
    subscription: subscriptionQuery,
    paymentHistory: paymentHistoryQuery,
    isLoading:
      memberQuery.isLoading ||
      subscriptionQuery.isLoading ||
      paymentHistoryQuery.isLoading,
    hasError:
      memberQuery.isError ||
      subscriptionQuery.isError ||
      paymentHistoryQuery.isError,
    data: {
      member: memberQuery.data,
      subscription: subscriptionQuery.data,
      paymentHistory: paymentHistoryQuery.data,
    },
  };
}

// Hook for multiple member queries with parallel fetching
export function useMultipleMemberQueries(memberIds: string[], enabled = true) {
  const queries = useQueries({
    queries: memberIds.map((id) => ({
      queryKey: memberKeys.detail(id),
      queryFn: () => memberUtils.getMemberById(id),
      enabled: enabled && !!id,
      staleTime: 10 * 60 * 1000,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const hasError = queries.some((q) => q.isError);
  const data = queries.map((q) => q.data).filter(Boolean) as Member[];
  const errors = queries.map((q) => q.error).filter(Boolean);

  return {
    queries,
    data,
    errors,
    isLoading,
    hasError,
    allLoaded: queries.every((q) => !q.isLoading && (q.data || q.isError)),
    successCount: queries.filter((q) => q.data && !q.isError).length,
    errorCount: queries.filter((q) => q.isError).length,
  };
}

// Hook for conditional queries based on member properties
export function useConditionalMemberQueries(
  member: Member | undefined,
  enabled = true
) {
  // Only fetch subscription if member is active
  const subscriptionQuery = useQuery({
    queryKey: ["subscription", member?.id],
    queryFn: async () => {
      // Subscription query implementation
      return {
        id: `sub_${member?.id}`,
        plan_name: "Premium",
        status: "active",
      };
    },
    enabled: enabled && !!member && member.status === "active",
    staleTime: 10 * 60 * 1000,
  });

  // Only fetch payment history if member has overdue payments
  const paymentIssuesQuery = useQuery({
    queryKey: ["payment-issues", member?.id],
    queryFn: async () => {
      // Payment issues query implementation
      return [
        {
          id: "issue_1",
          type: "overdue",
          amount: 59.99,
          due_date: "2024-01-15",
        },
      ];
    },
    enabled: enabled && !!member && member.status === "suspended",
    staleTime: 5 * 60 * 1000,
  });

  // Only fetch visit history if member is active and has recent activity
  const visitHistoryQuery = useQuery({
    queryKey: ["visits", member?.id],
    queryFn: async () => {
      // Visit history query implementation
      return Array.from({ length: 10 }, (_, i) => ({
        id: `visit_${i}`,
        member_id: member?.id,
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        duration: Math.floor(Math.random() * 120) + 30,
      }));
    },
    enabled: enabled && !!member && member.status === "active",
    staleTime: 30 * 60 * 1000,
  });

  return {
    subscription: subscriptionQuery,
    paymentIssues: paymentIssuesQuery,
    visitHistory: visitHistoryQuery,
    conditionalData: {
      hasSubscription: !!subscriptionQuery.data,
      hasPaymentIssues:
        !!paymentIssuesQuery.data && paymentIssuesQuery.data.length > 0,
      hasVisitHistory:
        !!visitHistoryQuery.data && visitHistoryQuery.data.length > 0,
    },
  };
}

// Hook for query orchestration with custom logic
export function useOrchestatedMemberQueries(
  memberId: string,
  options: {
    loadSubscriptionFirst?: boolean;
    skipAnalytics?: boolean;
    priorityData?: ("profile" | "subscription" | "analytics")[];
    enabled?: boolean;
  } = {}
) {
  const {
    loadSubscriptionFirst = false,
    skipAnalytics = false,
    priorityData = ["profile", "subscription", "analytics"],
    enabled = true,
  } = options;

  // Step 1: Always load member profile first
  const profileQuery = useQuery({
    queryKey: memberKeys.detail(memberId),
    queryFn: () => memberUtils.getMemberById(memberId),
    enabled: enabled && !!memberId,
    staleTime: 10 * 60 * 1000,
  });

  // Step 2: Load subscription (either immediately or after profile)
  const subscriptionQuery = useQuery({
    queryKey: ["subscription", memberId],
    queryFn: async () => ({
      id: `sub_${memberId}`,
      plan_name: "Premium",
      status: "active",
    }),
    enabled: enabled && (loadSubscriptionFirst || !!profileQuery.data),
    staleTime: 10 * 60 * 1000,
  });

  // Step 3: Load analytics last (if not skipped)
  const analyticsQuery = useQuery({
    queryKey: ["analytics", memberId],
    queryFn: async () => ({
      total_visits: 150,
      avg_duration: 90,
      engagement_score: 85,
    }),
    enabled:
      enabled &&
      !skipAnalytics &&
      !!profileQuery.data &&
      !!subscriptionQuery.data,
    staleTime: 30 * 60 * 1000,
  });

  // Determine loading priority
  const getPriorityStatus = () => {
    const status = {
      profile: profileQuery.isLoading,
      subscription: subscriptionQuery.isLoading,
      analytics: analyticsQuery.isLoading,
    };

    const currentlyLoading = priorityData.find((key) => status[key]);
    const nextToLoad = priorityData.find(
      (key) => !status[key] && !profileQuery.data && key !== "profile"
    );

    return {
      currentlyLoading,
      nextToLoad,
      allPriorityDataLoaded: priorityData.every((key) =>
        skipAnalytics && key === "analytics"
          ? true
          : key === "profile"
            ? !!profileQuery.data
            : key === "subscription"
              ? !!subscriptionQuery.data
              : key === "analytics"
                ? !!analyticsQuery.data
                : false
      ),
    };
  };

  const priorityStatus = getPriorityStatus();

  return {
    profile: profileQuery,
    subscription: subscriptionQuery,
    analytics: analyticsQuery,
    priorityStatus,
    orchestration: {
      isLoading:
        profileQuery.isLoading ||
        subscriptionQuery.isLoading ||
        (!skipAnalytics && analyticsQuery.isLoading),
      hasError:
        profileQuery.isError ||
        subscriptionQuery.isError ||
        analyticsQuery.isError,
      progress: {
        completed: [
          profileQuery.data,
          subscriptionQuery.data,
          !skipAnalytics ? analyticsQuery.data : true,
        ].filter(Boolean).length,
        total: skipAnalytics ? 2 : 3,
        percentage: Math.round(
          ([
            profileQuery.data,
            subscriptionQuery.data,
            !skipAnalytics ? analyticsQuery.data : true,
          ].filter(Boolean).length /
            (skipAnalytics ? 2 : 3)) *
            100
        ),
      },
    },
  };
}
