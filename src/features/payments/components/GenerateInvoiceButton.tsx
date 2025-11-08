/**
 * Generate Invoice Button Component
 *
 * Displays a button to manually generate an invoice for a payment.
 * Checks if invoice already exists and disables button accordingly.
 *
 * @module GenerateInvoiceButton
 */

import React, { memo, useCallback, useState, useEffect } from "react";
import { FileText, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useInvoices } from "@/features/invoices/hooks/use-invoices";
import { logger } from "@/lib/logger";
import type { SubscriptionPaymentWithReceiptAndPlan } from "@/features/database/lib/types";

interface GenerateInvoiceButtonProps {
  payment: SubscriptionPaymentWithReceiptAndPlan;
}

/**
 * Button component for manual invoice generation
 *
 * Features:
 * - Checks if invoice already exists
 * - Disables button if invoice exists
 * - Shows loading state during generation
 * - Displays tooltip with status information
 *
 * Performance optimized with React.memo to prevent unnecessary re-renders.
 *
 * @param payment - Payment record to generate invoice for
 */
export const GenerateInvoiceButton = memo(function GenerateInvoiceButton({
  payment,
}: GenerateInvoiceButtonProps) {
  const { generateInvoice, isGenerating, checkInvoiceExists } = useInvoices();
  const [hasInvoice, setHasInvoice] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check if invoice exists on mount
  useEffect(() => {
    const checkExistence = async () => {
      setIsChecking(true);
      try {
        const exists = await checkInvoiceExists(payment.id);
        setHasInvoice(exists);
      } catch (error) {
        logger.error("Failed to check invoice existence", {
          error: error instanceof Error ? error.message : String(error),
          payment_id: payment.id,
        });
        setHasInvoice(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkExistence();
  }, [payment.id, checkInvoiceExists]);

  // Handle invoice generation
  const handleGenerateInvoice = useCallback(async () => {
    try {
      await generateInvoice({
        payment_id: payment.id,
        member_id: payment.member_id,
        subscription_id: payment.subscription_id || undefined,
        amount: payment.amount,
      });

      // Update local state to reflect invoice now exists
      setHasInvoice(true);
    } catch (error) {
      logger.error("Failed to generate invoice", {
        error: error instanceof Error ? error.message : String(error),
        payment_id: payment.id,
      });
      // Error toast is handled by useInvoices hook
    }
  }, [generateInvoice, payment]);

  // Show loading spinner while checking
  if (isChecking) {
    return <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />;
  }

  // Show disabled state if invoice exists
  if (hasInvoice) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <FileText className="text-muted-foreground h-4 w-4 cursor-not-allowed opacity-50" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Invoice already exists</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Show generate button
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            {isGenerating ? (
              <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
            ) : (
              <FileText
                className="text-muted-foreground hover:text-foreground h-4 w-4 cursor-pointer"
                onClick={handleGenerateInvoice}
              />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isGenerating ? "Generating invoice..." : "Generate invoice"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
