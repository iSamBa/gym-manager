"use client";

import { useState, useCallback } from "react";
import {
  Trash2,
  Download,
  UserCheck,
  UserX,
  UserPlus,
  Clock,
  ChevronDown,
  Undo2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Member, MemberStatus } from "@/features/database/lib/types";
import type { BulkOperationResult } from "../hooks";

import { logger } from "@/lib/logger";
// Progress tracking interface for bulk operations
export interface BulkOperationProgress {
  current: number;
  total: number;
  percentage: number;
  currentBatch?: number;
  totalBatches?: number;
  estimatedTimeRemaining?: number;
  processingRate?: number;
}

export interface BulkActionToolbarProps {
  selectedMembers: Member[];
  selectedCount: number;
  onStatusChange?: (
    memberIds: string[],
    status: MemberStatus,
    onProgress?: (progress: BulkOperationProgress) => void
  ) => Promise<BulkOperationResult>;
  onDelete?: (
    memberIds: string[],
    softDelete?: boolean,
    onProgress?: (progress: BulkOperationProgress) => void
  ) => Promise<BulkOperationResult>;
  onExport?: (
    memberIds: string[],
    format: "csv" | "excel" | "json" | "pdf",
    onProgress?: (progress: BulkOperationProgress) => void
  ) => Promise<{ url: string; filename: string }>;
  onClearSelection?: () => void;
  onUndo?: () => void;
  className?: string;
  maxSelections?: number;
}

export function BulkActionToolbar({
  selectedMembers,
  selectedCount,
  onStatusChange,
  onDelete,
  onExport,
  onClearSelection,
  onUndo,
  className,
  maxSelections = 1000,
}: BulkActionToolbarProps) {
  // State for operation progress
  const [isOperationInProgress, setIsOperationInProgress] = useState(false);
  const [operationProgress, setOperationProgress] =
    useState<BulkOperationProgress | null>(null);
  const [operationType, setOperationType] = useState<string>("");
  const [operationResult, setOperationResult] =
    useState<BulkOperationResult | null>(null);

  // State for confirmation dialogs
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState<"soft" | "hard">("soft");
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<MemberStatus>("active");

  // Progress dialog visibility
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);

  const selectedMemberIds = selectedMembers.map((member) => member.id);
  const isAtLimit = selectedCount >= maxSelections;

  // Handle progress updates
  const handleProgress = useCallback((progress: BulkOperationProgress) => {
    setOperationProgress(progress);
  }, []);

  // Handle status change
  const handleStatusChange = useCallback(
    async (status: MemberStatus) => {
      if (!onStatusChange || selectedMemberIds.length === 0) return;

      setOperationType(`Updating ${selectedCount} members to ${status}`);
      setIsOperationInProgress(true);
      setShowProgressDialog(true);
      setShowStatusConfirm(false);

      try {
        const result = await onStatusChange(
          selectedMemberIds,
          status,
          handleProgress
        );
        setOperationResult(result);
        setShowResultDialog(true);

        if (result.totalFailed === 0 && onClearSelection) {
          onClearSelection();
        }
      } catch (error) {
        logger.error("Status change failed:", { error });
        setOperationResult({
          successful: [],
          failed: selectedMemberIds.map((id) => ({
            id,
            error: "Operation failed",
          })),
          totalProcessed: selectedCount,
          totalSuccessful: 0,
          totalFailed: selectedCount,
        });
        setShowResultDialog(true);
      } finally {
        setIsOperationInProgress(false);
        setShowProgressDialog(false);
        setOperationProgress(null);
      }
    },
    [
      selectedMemberIds,
      selectedCount,
      onStatusChange,
      onClearSelection,
      handleProgress,
    ]
  );

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!onDelete || selectedMemberIds.length === 0) return;

    setOperationType(
      `${deleteType === "hard" ? "Permanently deleting" : "Deactivating"} ${selectedCount} members`
    );
    setIsOperationInProgress(true);
    setShowProgressDialog(true);
    setShowDeleteConfirm(false);

    try {
      const result = await onDelete(
        selectedMemberIds,
        deleteType === "soft",
        handleProgress
      );
      setOperationResult(result);
      setShowResultDialog(true);

      if (result.totalFailed === 0 && onClearSelection) {
        onClearSelection();
      }
    } catch (error) {
      logger.error("Delete failed:", { error });
      setOperationResult({
        successful: [],
        failed: selectedMemberIds.map((id) => ({
          id,
          error: "Delete operation failed",
        })),
        totalProcessed: selectedCount,
        totalSuccessful: 0,
        totalFailed: selectedCount,
      });
      setShowResultDialog(true);
    } finally {
      setIsOperationInProgress(false);
      setShowProgressDialog(false);
      setOperationProgress(null);
    }
  }, [
    selectedMemberIds,
    selectedCount,
    onDelete,
    deleteType,
    onClearSelection,
    handleProgress,
  ]);

  // Handle export
  const handleExport = useCallback(
    async (format: "csv" | "excel" | "json" | "pdf") => {
      if (!onExport || selectedMemberIds.length === 0) return;

      setOperationType(
        `Exporting ${selectedCount} members as ${format.toUpperCase()}`
      );
      setIsOperationInProgress(true);
      setShowProgressDialog(true);

      try {
        const result = await onExport(
          selectedMemberIds,
          format,
          handleProgress
        );

        // Trigger download
        const link = document.createElement("a");
        link.href = result.url;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Cleanup URL
        URL.revokeObjectURL(result.url);
      } catch (error) {
        logger.error("Export failed:", { error });
      } finally {
        setIsOperationInProgress(false);
        setShowProgressDialog(false);
        setOperationProgress(null);
      }
    },
    [selectedMemberIds, selectedCount, onExport, handleProgress]
  );

  // Format time remaining
  const formatTimeRemaining = (ms?: number) => {
    if (!ms) return "Calculating...";
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      <div
        className={cn(
          "bg-muted/50 flex items-center gap-3 rounded-lg border p-4",
          "animate-in slide-in-from-bottom-2 duration-200",
          className
        )}
      >
        {/* Selection info */}
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Badge variant="secondary" className="font-medium">
            {selectedCount} selected
          </Badge>
          {isAtLimit && (
            <Badge variant="destructive" className="text-xs">
              Max reached
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-2">
          {/* Status change dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isOperationInProgress}
                className="gap-2"
              >
                <UserCheck className="h-4 w-4" />
                Status
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setPendingStatus("active");
                  setShowStatusConfirm(true);
                }}
              >
                <UserCheck className="mr-2 h-4 w-4 text-green-500" />
                Set Active
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setPendingStatus("inactive");
                  setShowStatusConfirm(true);
                }}
              >
                <UserX className="mr-2 h-4 w-4 text-gray-500" />
                Set Inactive
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setPendingStatus("suspended");
                  setShowStatusConfirm(true);
                }}
              >
                <Clock className="mr-2 h-4 w-4 text-orange-500" />
                Suspend
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setPendingStatus("pending");
                  setShowStatusConfirm(true);
                }}
              >
                <UserPlus className="mr-2 h-4 w-4 text-blue-500" />
                Set Pending
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isOperationInProgress}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("excel")}>
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("json")}>
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport("pdf")}>
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Delete dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isOperationInProgress}
                className="text-destructive hover:text-destructive gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setDeleteType("soft");
                  setShowDeleteConfirm(true);
                }}
              >
                <UserX className="mr-2 h-4 w-4" />
                Deactivate Members
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setDeleteType("hard");
                  setShowDeleteConfirm(true);
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Permanently Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Undo button */}
          {onUndo && (
            <Button
              variant="outline"
              size="sm"
              onClick={onUndo}
              disabled={isOperationInProgress}
              className="gap-2"
            >
              <Undo2 className="h-4 w-4" />
              Undo
            </Button>
          )}

          {/* Clear selection */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={isOperationInProgress}
            className="gap-2"
          >
            Clear Selection
          </Button>
        </div>
      </div>

      {/* Status change confirmation */}
      <AlertDialog open={showStatusConfirm} onOpenChange={setShowStatusConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Member Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the status of {selectedCount}{" "}
              member{selectedCount !== 1 ? "s" : ""} to &quot;{pendingStatus}
              &quot;? This action cannot be undone automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleStatusChange(pendingStatus)}
            >
              Update Status
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-destructive h-5 w-5" />
              {deleteType === "hard"
                ? "Permanently Delete Members"
                : "Deactivate Members"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteType === "hard" ? (
                <>
                  Are you sure you want to permanently delete {selectedCount}{" "}
                  member{selectedCount !== 1 ? "s" : ""}?
                  <strong className="text-destructive mt-2 block">
                    This action cannot be undone and will remove all associated
                    data.
                  </strong>
                </>
              ) : (
                <>
                  Are you sure you want to deactivate {selectedCount} member
                  {selectedCount !== 1 ? "s" : ""}? This will set their status
                  to inactive but preserve their data.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className={
                deleteType === "hard"
                  ? "bg-destructive hover:bg-destructive/90"
                  : ""
              }
            >
              {deleteType === "hard" ? "Permanently Delete" : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Progress dialog */}
      <Dialog open={showProgressDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{operationType}</DialogTitle>
            <DialogDescription>
              Please wait while the operation completes...
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {operationProgress && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>
                      {operationProgress.current} of {operationProgress.total}
                    </span>
                  </div>
                  <Progress
                    value={operationProgress.percentage}
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Batch:</span>{" "}
                    {operationProgress.currentBatch} of{" "}
                    {operationProgress.totalBatches}
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Time remaining:
                    </span>{" "}
                    {formatTimeRemaining(
                      operationProgress.estimatedTimeRemaining
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Result dialog */}
      <AlertDialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {operationResult?.totalFailed === 0
                ? "Operation Completed"
                : "Operation Completed with Errors"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                {operationResult && (
                  <>
                    <div className="flex justify-between">
                      <span>Total processed:</span>
                      <span>{operationResult.totalProcessed}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Successful:</span>
                      <span>{operationResult.totalSuccessful}</span>
                    </div>
                    {operationResult.totalFailed > 0 && (
                      <div className="text-destructive flex justify-between">
                        <span>Failed:</span>
                        <span>{operationResult.totalFailed}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowResultDialog(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
