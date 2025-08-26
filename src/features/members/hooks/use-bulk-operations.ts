import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  memberUtils,
  type CreateMemberData,
} from "@/features/database/lib/utils";
import type { Member, MemberStatus } from "@/features/database/lib/types";
import { memberKeys } from "./use-members";

// Bulk operation result interface
export interface BulkOperationResult {
  successful: string[];
  failed: Array<{ id: string; error: string }>;
  totalProcessed: number;
  totalSuccessful: number;
  totalFailed: number;
}

// Progress tracking interface
export interface BulkOperationProgress {
  current: number;
  total: number;
  percentage: number;
  currentBatch?: number;
  totalBatches?: number;
  estimatedTimeRemaining?: number;
  processingRate?: number; // items per second
}

// Enhanced bulk update members mutation
export function useBulkUpdateMembers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      updates,
      batchSize = 50,
      onProgress,
    }: {
      updates: Array<{ id: string; data: Partial<CreateMemberData> }>;
      batchSize?: number;
      onProgress?: (progress: BulkOperationProgress) => void;
    }): Promise<BulkOperationResult> => {
      const result: BulkOperationResult = {
        successful: [],
        failed: [],
        totalProcessed: 0,
        totalSuccessful: 0,
        totalFailed: 0,
      };

      const totalBatches = Math.ceil(updates.length / batchSize);
      const startTime = Date.now();

      // Process in batches
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        const currentBatch = Math.floor(i / batchSize) + 1;

        // Update progress
        if (onProgress) {
          const current = i;
          const elapsed = Date.now() - startTime;
          const processingRate = current > 0 ? current / (elapsed / 1000) : 0;
          const estimatedTimeRemaining =
            processingRate > 0
              ? ((updates.length - current) / processingRate) * 1000
              : undefined;

          onProgress({
            current,
            total: updates.length,
            percentage: (current / updates.length) * 100,
            currentBatch,
            totalBatches,
            estimatedTimeRemaining,
            processingRate,
          });
        }

        // Process batch
        const batchPromises = batch.map(async ({ id, data }) => {
          try {
            await memberUtils.updateMember(id, data);
            result.successful.push(id);
            return { success: true, id };
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Unknown error";
            result.failed.push({ id, error: errorMessage });
            return { success: false, id, error: errorMessage };
          }
        });

        await Promise.all(batchPromises);
        result.totalProcessed = i + batch.length;
      }

      // Final progress update
      if (onProgress) {
        onProgress({
          current: updates.length,
          total: updates.length,
          percentage: 100,
          currentBatch: totalBatches,
          totalBatches,
        });
      }

      result.totalSuccessful = result.successful.length;
      result.totalFailed = result.failed.length;

      return result;
    },

    onSuccess: (result) => {
      // Invalidate relevant queries for successful updates
      if (result.successful.length > 0) {
        queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
        queryClient.invalidateQueries({ queryKey: memberKeys.count() });
        queryClient.invalidateQueries({ queryKey: memberKeys.countByStatus() });

        // Invalidate individual member queries
        result.successful.forEach((id) => {
          queryClient.invalidateQueries({ queryKey: memberKeys.detail(id) });
        });
      }
    },

    onError: (error) => {
      console.error("Bulk update failed:", error);
    },
  });
}

// Enhanced bulk delete members mutation with soft delete support
export function useBulkDeleteMembers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberIds,
      softDelete = true,
      batchSize = 50,
      onProgress,
    }: {
      memberIds: string[];
      softDelete?: boolean;
      batchSize?: number;
      onProgress?: (progress: BulkOperationProgress) => void;
    }): Promise<BulkOperationResult> => {
      const result: BulkOperationResult = {
        successful: [],
        failed: [],
        totalProcessed: 0,
        totalSuccessful: 0,
        totalFailed: 0,
      };

      const totalBatches = Math.ceil(memberIds.length / batchSize);
      const startTime = Date.now();

      // Store members for potential rollback
      const membersToDelete: Member[] = [];

      for (let i = 0; i < memberIds.length; i += batchSize) {
        const batch = memberIds.slice(i, i + batchSize);
        const currentBatch = Math.floor(i / batchSize) + 1;

        // Update progress
        if (onProgress) {
          const current = i;
          const elapsed = Date.now() - startTime;
          const processingRate = current > 0 ? current / (elapsed / 1000) : 0;
          const estimatedTimeRemaining =
            processingRate > 0
              ? ((memberIds.length - current) / processingRate) * 1000
              : undefined;

          onProgress({
            current,
            total: memberIds.length,
            percentage: (current / memberIds.length) * 100,
            currentBatch,
            totalBatches,
            estimatedTimeRemaining,
            processingRate,
          });
        }

        // Get member data before deletion for rollback capability
        const batchMembersPromises = batch.map(async (id) => {
          try {
            return await memberUtils.getMemberById(id);
          } catch {
            return null;
          }
        });

        const batchMembers = await Promise.all(batchMembersPromises);
        membersToDelete.push(...(batchMembers.filter(Boolean) as Member[]));

        // Process deletions
        const deletionPromises = batch.map(async (id) => {
          try {
            if (softDelete) {
              // Soft delete by updating status
              await memberUtils.updateMemberStatus(id, "inactive");
            } else {
              // Hard delete
              await memberUtils.deleteMember(id);
            }
            result.successful.push(id);
            return { success: true, id };
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Unknown error";
            result.failed.push({ id, error: errorMessage });
            return { success: false, id, error: errorMessage };
          }
        });

        await Promise.all(deletionPromises);
        result.totalProcessed = i + batch.length;
      }

      // Final progress update
      if (onProgress) {
        onProgress({
          current: memberIds.length,
          total: memberIds.length,
          percentage: 100,
          currentBatch: totalBatches,
          totalBatches,
        });
      }

      result.totalSuccessful = result.successful.length;
      result.totalFailed = result.failed.length;

      return result;
    },

    onMutate: async ({ memberIds, softDelete }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: memberKeys.lists() });

      // Get current member data for rollback
      const previousMembers = memberIds
        .map((id) => queryClient.getQueryData<Member>(memberKeys.detail(id)))
        .filter(Boolean) as Member[];

      // Optimistically update the cache
      if (softDelete) {
        // For soft delete, update status to inactive
        memberIds.forEach((id) => {
          queryClient.setQueryData(
            memberKeys.detail(id),
            (old: Member | undefined) =>
              old ? { ...old, status: "inactive" as MemberStatus } : undefined
          );
        });

        // Update lists
        queryClient.setQueriesData(
          { queryKey: memberKeys.lists() },
          (oldData: Member[] | undefined) =>
            oldData?.map((member) =>
              memberIds.includes(member.id)
                ? { ...member, status: "inactive" as MemberStatus }
                : member
            )
        );
      } else {
        // For hard delete, remove from cache
        memberIds.forEach((id) => {
          queryClient.removeQueries({ queryKey: memberKeys.detail(id) });
        });

        // Remove from lists
        queryClient.setQueriesData(
          { queryKey: memberKeys.lists() },
          (oldData: Member[] | undefined) =>
            oldData?.filter((member) => !memberIds.includes(member.id))
        );
      }

      return { previousMembers };
    },

    onError: (error, _variables, context) => {
      // Rollback optimistic updates
      if (context?.previousMembers) {
        context.previousMembers.forEach((member) => {
          queryClient.setQueryData(memberKeys.detail(member.id), member);
        });
      }
      console.error("Bulk delete failed:", error);
    },

    onSuccess: () => {
      // Invalidate queries on success
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
      queryClient.invalidateQueries({ queryKey: memberKeys.count() });
      queryClient.invalidateQueries({ queryKey: memberKeys.countByStatus() });
    },
  });
}

// Bulk export members mutation
export function useBulkExportMembers() {
  return useMutation({
    mutationFn: async ({
      memberIds,
      format = "csv",
      fields,
      onProgress,
    }: {
      memberIds: string[];
      format?: "csv" | "excel" | "json" | "pdf";
      fields?: Array<keyof Member>;
      onProgress?: (progress: BulkOperationProgress) => void;
    }): Promise<{ url: string; filename: string }> => {
      const batchSize = 100;
      const allMemberData: Member[] = [];
      const totalBatches = Math.ceil(memberIds.length / batchSize);
      const startTime = Date.now();

      // Fetch member data in batches
      for (let i = 0; i < memberIds.length; i += batchSize) {
        const batch = memberIds.slice(i, i + batchSize);
        const currentBatch = Math.floor(i / batchSize) + 1;

        // Update progress
        if (onProgress) {
          const current = i;
          const elapsed = Date.now() - startTime;
          const processingRate = current > 0 ? current / (elapsed / 1000) : 0;
          const estimatedTimeRemaining =
            processingRate > 0
              ? ((memberIds.length - current) / processingRate) * 1000
              : undefined;

          onProgress({
            current,
            total: memberIds.length,
            percentage: (current / memberIds.length) * 100,
            currentBatch,
            totalBatches,
            estimatedTimeRemaining,
            processingRate,
          });
        }

        // Fetch batch data
        const batchPromises = batch.map((id) => memberUtils.getMemberById(id));
        const batchData = await Promise.all(batchPromises);
        allMemberData.push(...batchData.filter(Boolean));
      }

      // Filter fields if specified
      const exportData = fields
        ? allMemberData.map((member) =>
            Object.fromEntries(fields.map((field) => [field, member[field]]))
          )
        : allMemberData;

      // Generate file based on format
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `members-export-${timestamp}.${format}`;

      let blob: Blob;
      // let mimeType: string; // Reserved for future use

      switch (format) {
        case "csv":
          const csvContent = generateCSV(exportData);
          blob = new Blob([csvContent], { type: "text/csv" });
          // mimeType = 'text/csv';
          break;

        case "json":
          const jsonContent = JSON.stringify(exportData, null, 2);
          blob = new Blob([jsonContent], { type: "application/json" });
          // mimeType = 'application/json';
          break;

        case "excel":
          // For Excel format, we would use a library like xlsx
          // For now, fallback to CSV
          const excelCsvContent = generateCSV(exportData);
          blob = new Blob([excelCsvContent], {
            type: "application/vnd.ms-excel",
          });
          // mimeType = 'application/vnd.ms-excel';
          break;

        case "pdf":
          // For PDF format, we would use a library like jsPDF
          // For now, fallback to JSON
          const pdfJsonContent = JSON.stringify(exportData, null, 2);
          blob = new Blob([pdfJsonContent], { type: "application/pdf" });
          // mimeType = 'application/pdf';
          break;

        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      // Create download URL
      const url = URL.createObjectURL(blob);

      // Final progress update
      if (onProgress) {
        onProgress({
          current: memberIds.length,
          total: memberIds.length,
          percentage: 100,
          currentBatch: totalBatches,
          totalBatches,
        });
      }

      return { url, filename };
    },

    onError: (error) => {
      console.error("Bulk export failed:", error);
    },
  });
}

// Enhanced bulk status update with better error handling
export function useBulkUpdateMemberStatusEnhanced() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberIds,
      status,
      batchSize = 50,
      onProgress,
    }: {
      memberIds: string[];
      status: MemberStatus;
      batchSize?: number;
      onProgress?: (progress: BulkOperationProgress) => void;
    }): Promise<BulkOperationResult> => {
      const result: BulkOperationResult = {
        successful: [],
        failed: [],
        totalProcessed: 0,
        totalSuccessful: 0,
        totalFailed: 0,
      };

      const totalBatches = Math.ceil(memberIds.length / batchSize);
      const startTime = Date.now();

      // Process in batches to avoid overwhelming the server
      for (let i = 0; i < memberIds.length; i += batchSize) {
        const batch = memberIds.slice(i, i + batchSize);
        const currentBatch = Math.floor(i / batchSize) + 1;

        // Update progress
        if (onProgress) {
          const current = i;
          const elapsed = Date.now() - startTime;
          const processingRate = current > 0 ? current / (elapsed / 1000) : 0;
          const estimatedTimeRemaining =
            processingRate > 0
              ? ((memberIds.length - current) / processingRate) * 1000
              : undefined;

          onProgress({
            current,
            total: memberIds.length,
            percentage: (current / memberIds.length) * 100,
            currentBatch,
            totalBatches,
            estimatedTimeRemaining,
            processingRate,
          });
        }

        // Process batch with individual error handling
        const batchPromises = batch.map(async (id) => {
          try {
            await memberUtils.updateMemberStatus(id, status);
            result.successful.push(id);
            return { success: true, id };
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Unknown error";
            result.failed.push({ id, error: errorMessage });
            return { success: false, id, error: errorMessage };
          }
        });

        await Promise.all(batchPromises);
        result.totalProcessed = i + batch.length;

        // Small delay between batches to prevent server overload
        if (currentBatch < totalBatches) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      // Final progress update
      if (onProgress) {
        onProgress({
          current: memberIds.length,
          total: memberIds.length,
          percentage: 100,
          currentBatch: totalBatches,
          totalBatches,
        });
      }

      result.totalSuccessful = result.successful.length;
      result.totalFailed = result.failed.length;

      return result;
    },

    onMutate: async ({ memberIds, status }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: memberKeys.lists() });

      // Get current data for rollback
      const previousData = memberIds
        .map((id) => queryClient.getQueryData<Member>(memberKeys.detail(id)))
        .filter(Boolean) as Member[];

      // Optimistically update all affected members
      memberIds.forEach((id) => {
        queryClient.setQueryData(
          memberKeys.detail(id),
          (old: Member | undefined) =>
            old
              ? { ...old, status, updated_at: new Date().toISOString() }
              : undefined
        );
      });

      // Update in lists
      queryClient.setQueriesData(
        { queryKey: memberKeys.lists() },
        (oldData: Member[] | undefined) =>
          oldData?.map((member) =>
            memberIds.includes(member.id)
              ? { ...member, status, updated_at: new Date().toISOString() }
              : member
          )
      );

      return { previousData };
    },

    onError: (error, _variables, context) => {
      // Rollback optimistic updates for all members
      if (context?.previousData) {
        context.previousData.forEach((member) => {
          queryClient.setQueryData(memberKeys.detail(member.id), member);
        });
      }

      // Refresh lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });

      console.error("Bulk status update failed:", error);
    },

    onSuccess: (result) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: memberKeys.countByStatus() });

      // Only invalidate successful updates
      if (result.successful.length > 0) {
        queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
      }
    },
  });
}

// Helper function to generate CSV content
function generateCSV(data: unknown[]): string {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0] as Record<string, unknown>);
  const csvRows = [
    headers.join(","), // Header row
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = (row as Record<string, unknown>)[header];
          // Escape commas and quotes in CSV
          const stringValue = String(value ?? "");
          return stringValue.includes(",") || stringValue.includes('"')
            ? `"${stringValue.replace(/"/g, '""')}"`
            : stringValue;
        })
        .join(",")
    ),
  ];

  return csvRows.join("\n");
}
