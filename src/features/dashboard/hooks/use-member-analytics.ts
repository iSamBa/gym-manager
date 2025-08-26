"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface MemberEvolutionData {
  month: string;
  totalMembers: number;
  newMembers: number;
}

interface MemberTypeData {
  planType: string;
  count: number;
  percentage: number;
}

interface MemberStatusData {
  status: string;
  count: number;
  percentage: number;
}

export function useMemberEvolution(months: number = 12) {
  const [data, setData] = useState<MemberEvolutionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMemberEvolution() {
      setIsLoading(true);
      setError(null);

      try {
        // Get member creation data for the last N months
        const { data: members, error: membersError } = await supabase
          .from("members")
          .select("created_at")
          .order("created_at", { ascending: true });

        if (membersError) throw membersError;

        // Generate last N months
        const monthsData: MemberEvolutionData[] = [];
        const now = new Date();

        for (let i = months - 1; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthName = date.toLocaleDateString("en-US", {
            month: "short",
            year: "2-digit",
          });

          const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
          const monthEnd = new Date(
            date.getFullYear(),
            date.getMonth() + 1,
            0,
            23,
            59,
            59
          );

          // Count members created in this month
          const newMembers =
            members?.filter((member) => {
              const createdAt = new Date(member.created_at);
              return createdAt >= monthStart && createdAt <= monthEnd;
            }).length || 0;

          // Count total members up to this month
          const totalMembers =
            members?.filter((member) => {
              const createdAt = new Date(member.created_at);
              return createdAt <= monthEnd;
            }).length || 0;

          monthsData.push({
            month: monthName,
            totalMembers,
            newMembers,
          });
        }

        setData(monthsData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch member evolution"
        );
        console.error("Error fetching member evolution:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMemberEvolution();
  }, [months]);

  return { data, isLoading, error };
}

export function useMemberTypeDistribution() {
  const [data, setData] = useState<MemberTypeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMemberTypeDistribution() {
      setIsLoading(true);
      setError(null);

      try {
        // Get active member subscriptions with their plan types
        const { data: subscriptions, error: subscriptionsError } =
          await supabase
            .from("member_subscriptions")
            .select(
              `
            id,
            plan_id,
            subscription_plans(plan_type)
          `
            )
            .eq("status", "active");

        if (subscriptionsError) throw subscriptionsError;

        // Count by plan type
        const typeCounts: Record<string, number> = {};
        let totalMembers = 0;

        subscriptions?.forEach((subscription) => {
          const planType = (
            subscription.subscription_plans as { plan_type: string } | null
          )?.plan_type;
          if (planType) {
            typeCounts[planType] = (typeCounts[planType] || 0) + 1;
            totalMembers++;
          }
        });

        // Convert to array with percentages
        const distributionData = Object.entries(typeCounts).map(
          ([planType, count]) => ({
            planType,
            count,
            percentage: Math.round((count / totalMembers) * 100),
          })
        );

        // Sort by count (descending)
        distributionData.sort((a, b) => b.count - a.count);

        setData(distributionData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch member type distribution"
        );
        console.error("Error fetching member type distribution:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMemberTypeDistribution();
  }, []);

  return { data, isLoading, error };
}

export function useMemberStatusDistribution() {
  const [data, setData] = useState<MemberStatusData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMemberStatusDistribution() {
      setIsLoading(true);
      setError(null);

      try {
        // Get all members and count by status
        const { data: members, error: membersError } = await supabase
          .from("members")
          .select("status");

        if (membersError) throw membersError;

        // Count by status
        const statusCounts: Record<string, number> = {};
        let totalMembers = 0;

        members?.forEach((member) => {
          const status = member.status;
          if (status) {
            statusCounts[status] = (statusCounts[status] || 0) + 1;
            totalMembers++;
          }
        });

        // Convert to array with percentages
        const statusData = Object.entries(statusCounts).map(
          ([status, count]) => ({
            status,
            count,
            percentage:
              totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0,
          })
        );

        // Sort by count (descending)
        statusData.sort((a, b) => b.count - a.count);

        setData(statusData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch member status distribution"
        );
        console.error("Error fetching member status distribution:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMemberStatusDistribution();
  }, []);

  return { data, isLoading, error };
}
