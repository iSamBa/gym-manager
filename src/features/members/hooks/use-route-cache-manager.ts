import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { memberKeys } from "./use-members";
import { useMemberCacheUtils } from "./use-member-search";

/**
 * Hook for managing cache invalidation and background refetching based on route changes
 */
export function useRouteCacheManager() {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const { refreshMemberInBackground } = useMemberCacheUtils();

  // Background refetch active queries when navigating back to member pages
  const handleRouteChange = useCallback(
    (url: string) => {
      // Members list page - refresh member lists
      if (url === "/members") {
        queryClient.refetchQueries({
          queryKey: memberKeys.lists(),
          type: "active",
        });

        // Also refresh counts for the stats cards
        queryClient.refetchQueries({
          queryKey: memberKeys.count(),
          type: "active",
        });
        queryClient.refetchQueries({
          queryKey: memberKeys.countByStatus(),
          type: "active",
        });
      }

      // Member detail page - refresh specific member
      const memberDetailMatch = url.match(/^\/members\/([^\/]+)$/);
      if (memberDetailMatch) {
        const memberId = memberDetailMatch[1];
        if (memberId !== "new") {
          refreshMemberInBackground(memberId);
        }
      }

      // Member edit page - ensure fresh data
      const memberEditMatch = url.match(/^\/members\/([^\/]+)\/edit$/);
      if (memberEditMatch) {
        const memberId = memberEditMatch[1];
        // Force refresh for edit pages to ensure data is current
        queryClient.refetchQueries({
          queryKey: memberKeys.detail(memberId),
          type: "active",
        });
      }
    },
    [queryClient, refreshMemberInBackground]
  );

  // Handle visibility change (when user returns to the tab)
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === "visible") {
      // Refresh current page data when user returns
      if (pathname === "/members") {
        queryClient.refetchQueries({
          queryKey: memberKeys.lists(),
          type: "active",
        });
      } else if (pathname.startsWith("/members/")) {
        const segments = pathname.split("/");
        if (segments.length >= 3) {
          const memberId = segments[2];
          if (memberId !== "new") {
            refreshMemberInBackground(memberId);
          }
        }
      }
    }
  }, [pathname, queryClient, refreshMemberInBackground]);

  // Handle window focus (additional refresh trigger)
  const handleWindowFocus = useCallback(() => {
    // Only refresh if we haven't refreshed recently
    const lastRefresh = sessionStorage.getItem("last-member-refresh");
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (!lastRefresh || now - parseInt(lastRefresh) > fiveMinutes) {
      handleVisibilityChange();
      sessionStorage.setItem("last-member-refresh", now.toString());
    }
  }, [handleVisibilityChange]);

  // Setup event listeners
  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [handleVisibilityChange, handleWindowFocus]);

  // Handle route changes
  useEffect(() => {
    handleRouteChange(pathname);
  }, [pathname, handleRouteChange]);

  // Cache warming for predictive loading
  const warmCache = useCallback(
    (type: "member-list" | "member-detail" | "member-counts") => {
      switch (type) {
        case "member-list":
          queryClient.prefetchQuery({
            queryKey: memberKeys.lists(),
            queryFn: async () => {
              const { memberUtils } = await import(
                "@/features/database/lib/utils"
              );
              return memberUtils.getMembers({});
            },
            staleTime: 5 * 60 * 1000, // 5 minutes
          });
          break;

        case "member-counts":
          queryClient.prefetchQuery({
            queryKey: memberKeys.countByStatus(),
            queryFn: async () => {
              const { memberUtils } = await import(
                "@/features/database/lib/utils"
              );
              return memberUtils.getMemberCountByStatus();
            },
            staleTime: 15 * 60 * 1000, // 15 minutes
          });
          break;
      }
    },
    [queryClient]
  );

  // Cleanup stale queries when leaving member section
  const cleanupStaleQueries = useCallback(() => {
    if (!pathname.startsWith("/members")) {
      // Remove old search queries when leaving members section
      queryClient.removeQueries({
        queryKey: memberKeys.all,
        predicate: (query) => {
          const key = query.queryKey;
          return key.includes("search") && query.state.dataUpdateCount === 0;
        },
      });

      // Remove stale member details (keep recently accessed ones)
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      queryClient.removeQueries({
        queryKey: memberKeys.details(),
        predicate: (query) => {
          return query.state.dataUpdatedAt < fiveMinutesAgo;
        },
      });
    }
  }, [pathname, queryClient]);

  useEffect(() => {
    cleanupStaleQueries();
  }, [cleanupStaleQueries]);

  return {
    warmCache,
    refreshCurrentPage: () => handleVisibilityChange(),
  };
}

/**
 * Hook for managing page-level cache strategies
 */
export function usePageCacheStrategy(
  pageType: "list" | "detail" | "create" | "edit"
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    switch (pageType) {
      case "list":
        // Warm up member counts for stats cards
        queryClient.prefetchQuery({
          queryKey: memberKeys.countByStatus(),
          queryFn: async () => {
            const { memberUtils } = await import(
              "@/features/database/lib/utils"
            );
            return memberUtils.getMemberCountByStatus();
          },
          staleTime: 15 * 60 * 1000,
        });
        break;

      case "create":
        // Pre-warm validation cache
        queryClient.prefetchQuery({
          queryKey: ["member-validation", "recent-numbers"],
          queryFn: async () => {
            const { memberUtils } = await import(
              "@/features/database/lib/utils"
            );
            // Get recent member numbers to avoid conflicts
            const recentMembers = await memberUtils.getMembers({
              limit: 50,
              orderBy: "created_at",
              orderDirection: "desc",
            });
            return recentMembers.map((m) => m.member_number);
          },
          staleTime: 10 * 60 * 1000,
        });
        break;

      case "detail":
        // No additional prefetching needed - handled by component
        break;

      case "edit":
        // Ensure we have the latest data
        queryClient.refetchQueries({
          queryKey: memberKeys.all,
          type: "active",
        });
        break;
    }
  }, [pageType, queryClient]);
}
