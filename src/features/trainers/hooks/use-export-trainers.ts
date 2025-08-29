import { useState, useCallback } from "react";
import { toast } from "sonner";
import type {
  Trainer,
  TrainerWithProfile,
} from "@/features/database/lib/types";
import { exportTrainersToCSV } from "../lib/csv-utils";

interface UseExportTrainersReturn {
  isExporting: boolean;
  exportTrainers: (trainers: Trainer[] | TrainerWithProfile[]) => Promise<void>;
  exportCount: number;
}

/**
 * Hook for exporting trainers to CSV with loading states and error handling
 */
export function useExportTrainers(): UseExportTrainersReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [exportCount, setExportCount] = useState(0);

  const exportTrainers = useCallback(
    async (trainers: Trainer[] | TrainerWithProfile[]) => {
      if (isExporting) return; // Prevent multiple simultaneous exports

      if (!trainers || trainers.length === 0) {
        toast.error("No trainers to export", {
          description:
            "The trainer list is empty or no trainers match your current filters.",
        });
        return;
      }

      setIsExporting(true);
      setExportCount(trainers.length);

      try {
        // Add a small delay to show loading state for better UX
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Perform the CSV export
        exportTrainersToCSV(trainers);

        // Show success notification
        toast.success("Export completed successfully", {
          description: `${trainers.length} trainer${trainers.length !== 1 ? "s" : ""} exported to CSV file.`,
        });
      } catch (error) {
        console.error("Export failed:", error);

        toast.error("Export failed", {
          description:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred while exporting trainers.",
        });
      } finally {
        setIsExporting(false);
      }
    },
    [isExporting]
  );

  return {
    isExporting,
    exportTrainers,
    exportCount,
  };
}
