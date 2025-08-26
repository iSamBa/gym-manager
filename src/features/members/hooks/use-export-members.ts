import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { Member } from "@/features/database/lib/types";
import { exportMembersToCSV } from "../lib/csv-utils";

interface UseExportMembersReturn {
  isExporting: boolean;
  exportMembers: (members: Member[]) => Promise<void>;
  exportCount: number;
}

/**
 * Hook for exporting members to CSV with loading states and error handling
 */
export function useExportMembers(): UseExportMembersReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [exportCount, setExportCount] = useState(0);

  const exportMembers = useCallback(
    async (members: Member[]) => {
      if (isExporting) return; // Prevent multiple simultaneous exports

      if (!members || members.length === 0) {
        toast.error("No members to export", {
          description:
            "The member list is empty or no members match your current filters.",
        });
        return;
      }

      setIsExporting(true);
      setExportCount(members.length);

      try {
        // Add a small delay to show loading state for better UX
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Perform the CSV export
        exportMembersToCSV(members);

        // Show success notification
        toast.success("Export completed successfully", {
          description: `${members.length} member${members.length !== 1 ? "s" : ""} exported to CSV file.`,
        });
      } catch (error) {
        console.error("Export failed:", error);

        toast.error("Export failed", {
          description:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred while exporting members.",
        });
      } finally {
        setIsExporting(false);
      }
    },
    [isExporting]
  );

  return {
    isExporting,
    exportMembers,
    exportCount,
  };
}
