"use client";

import React, { memo, useCallback, useState } from "react";
import { Download, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface InvoiceViewDialogProps {
  pdfUrl: string | null;
  invoiceNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: () => void;
  isDownloading?: boolean;
}

export const InvoiceViewDialog = memo(function InvoiceViewDialog({
  pdfUrl,
  invoiceNumber,
  open,
  onOpenChange,
  onDownload,
  isDownloading = false,
}: InvoiceViewDialogProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  const handleIframeError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  const handleDownloadClick = useCallback(() => {
    onDownload();
  }, [onDownload]);

  // Reset loading state when dialog opens/closes or PDF URL changes
  React.useEffect(() => {
    if (open && pdfUrl) {
      setIsLoading(true);
      setHasError(false);
    }
  }, [open, pdfUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[95vh] w-[95vw] flex-col sm:max-w-[95vw]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Invoice {invoiceNumber}</DialogTitle>
          <DialogDescription>View and download your invoice</DialogDescription>
        </DialogHeader>

        <div className="relative flex-1 overflow-hidden">
          {isLoading && (
            <div className="bg-background absolute inset-0 flex items-center justify-center">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            </div>
          )}

          {hasError && (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to load PDF. Please try downloading instead.
              </AlertDescription>
            </Alert>
          )}

          {pdfUrl && (
            <iframe
              src={pdfUrl}
              className="h-full w-full border-0"
              title={`Invoice ${invoiceNumber}`}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
          )}
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleDownloadClick}
            disabled={isDownloading || !pdfUrl}
          >
            {isDownloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
