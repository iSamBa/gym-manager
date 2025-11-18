"use client";

/**
 * BulkInvoiceToolbar Component
 *
 * Provides UI for triggering bulk invoice downloads with progress tracking and result reporting.
 * Integrates with useBulkInvoiceDownload hook for business logic.
 *
 * Features:
 * - Selection count badge
 * - Download and clear buttons
 * - Confirmation dialog before download
 * - Progress dialog with real-time updates
 * - Result dialog with success/failure details
 * - Maximum selection limit (default: 100)
 */

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Download, X } from "lucide-react";

import { useBulkInvoiceDownload } from "@/features/invoices/hooks/use-bulk-invoice-download";
import type { BulkOperationResult } from "@/features/members/hooks";

/**
 * Minimum payment data required for bulk invoice download
 */
interface Payment {
  id: string;
  receipt_number: string;
}

/**
 * Props for BulkInvoiceToolbar component
 */
interface BulkInvoiceToolbarProps {
  /** Selected payment objects (only id and receipt_number required) */
  selectedPayments: Payment[];
  /** Number of selected payments (for display) */
  selectedCount: number;
  /** Callback to clear selection */
  onClearSelection?: () => void;
  /** Maximum number of invoices allowed (default: 100) */
  maxSelections?: number;
}

/**
 * Toolbar component for bulk invoice download operations
 *
 * @example
 * ```tsx
 * <BulkInvoiceToolbar
 *   selectedPayments={selectedPaymentObjects}
 *   selectedCount={selectedPayments.size}
 *   onClearSelection={handleClearSelection}
 * />
 * ```
 */
export function BulkInvoiceToolbar({
  selectedPayments,
  selectedCount,
  onClearSelection,
  maxSelections = 100,
}: BulkInvoiceToolbarProps) {
  // Dialog states
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [result, setResult] = useState<BulkOperationResult | null>(null);

  // Hook for bulk download
  const { downloadInvoices, isProcessing, progress } = useBulkInvoiceDownload();

  // Check if exceeds limit
  const exceedsLimit = useMemo(
    () => selectedCount > maxSelections,
    [selectedCount, maxSelections]
  );

  /**
   * Handle download button click - shows confirmation dialog
   */
  const handleDownloadClick = () => {
    if (exceedsLimit) return;
    setShowConfirmDialog(true);
  };

  /**
   * Handle confirmed download - starts the bulk download process
   */
  const handleConfirmDownload = async () => {
    setShowConfirmDialog(false);
    setShowProgressDialog(true);

    try {
      // Transform payment data for hook (simplified - no member/subscription needed)
      const invoiceData = selectedPayments.map((payment) => ({
        paymentId: payment.id,
        receiptNumber: payment.receipt_number,
      }));

      // Process download
      const operationResult = await downloadInvoices(invoiceData);

      // Show results
      setResult(operationResult);
      setShowProgressDialog(false);
      setShowResultDialog(true);

      // Clear selection if any succeeded
      if (operationResult.totalSuccessful > 0) {
        onClearSelection?.();
      }
    } catch {
      // Error already handled by hook (toast shown)
      setShowProgressDialog(false);
    }
  };

  return (
    <>
      {/* Toolbar */}
      <div className="bg-muted/50 flex items-center gap-2 rounded-lg border p-4">
        <Badge variant="secondary" className="font-semibold">
          {selectedCount} selected
        </Badge>

        <div className="flex-1" />

        <Button
          onClick={handleDownloadClick}
          disabled={selectedCount === 0 || exceedsLimit || isProcessing}
          size="sm"
          variant="default"
        >
          <Download className="mr-2 h-4 w-4" />
          Download Invoices
        </Button>

        <Button
          onClick={onClearSelection}
          disabled={selectedCount === 0 || isProcessing}
          size="sm"
          variant="outline"
        >
          <X className="mr-2 h-4 w-4" />
          Clear
        </Button>

        {exceedsLimit && (
          <p className="text-destructive text-sm">
            Maximum {maxSelections} invoices allowed
          </p>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Download {selectedCount} Invoice{selectedCount > 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will generate a ZIP file containing {selectedCount} invoice
              PDF
              {selectedCount > 1 ? "s" : ""}. This may take a few moments for
              large batches.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDownload}>
              Download
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Progress Dialog */}
      <Dialog open={showProgressDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Generating Invoices</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  Processing {progress?.current || 0} of {progress?.total || 0}
                </span>
                <span>{Math.round(progress?.percentage || 0)}%</span>
              </div>
              <Progress value={progress?.percentage || 0} />
            </div>
            {progress?.currentBatch && progress?.totalBatches && (
              <p className="text-muted-foreground text-sm">
                Batch {progress.currentBatch} of {progress.totalBatches}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <AlertDialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Download Complete</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Successfully downloaded {result?.totalSuccessful || 0} invoice
                  {result?.totalSuccessful !== 1 ? "s" : ""}.
                </p>
                {result && result.totalFailed > 0 && (
                  <div className="bg-destructive/10 rounded-md p-3">
                    <p className="text-destructive font-semibold">
                      {result.totalFailed} invoice
                      {result.totalFailed > 1 ? "s" : ""} failed:
                    </p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {result.failed.slice(0, 5).map((item) => (
                        <li key={item.id}>
                          Payment ID: {item.id.substring(0, 8)}... -{" "}
                          {item.error}
                        </li>
                      ))}
                      {result.failed.length > 5 && (
                        <li>...and {result.failed.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowResultDialog(false)}>
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
