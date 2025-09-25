"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DollarSign, AlertTriangle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { useProcessRefund } from "../hooks/use-payments";
import { paymentUtils } from "../lib/payment-utils";
import type { SubscriptionPaymentWithReceipt } from "@/features/database/lib/types";
import type { AllPaymentsResponse } from "../hooks/use-all-payments";
import { useQuery } from "@tanstack/react-query";

type PaymentDialogPayment =
  | SubscriptionPaymentWithReceipt
  | AllPaymentsResponse["payments"][0];

interface RefundDialogProps {
  payment: PaymentDialogPayment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const refundFormSchema = z.object({
  amount: z.number().min(0.01, "Refund amount must be greater than 0"),
  reason: z
    .string()
    .min(1, "Refund reason is required")
    .max(500, "Reason must be less than 500 characters"),
});

type RefundFormData = z.infer<typeof refundFormSchema>;

export function RefundDialog({
  payment,
  open,
  onOpenChange,
  onSuccess,
}: RefundDialogProps) {
  const processRefundMutation = useProcessRefund();

  // Get current refund information using the new system
  const { data: refundInfo, isLoading: isLoadingRefundInfo } = useQuery({
    queryKey: ["payment-refunds", payment.id],
    queryFn: () => paymentUtils.getPaymentRefundInfo(payment.id),
    enabled: open, // Only fetch when dialog is open
  });

  const currentRefundAmount = refundInfo?.totalRefunded || 0;
  const maxRefundAmount = payment.amount - currentRefundAmount;

  // Create dynamic validation schema that updates with maxRefundAmount
  const dynamicRefundFormSchema = refundFormSchema.refine(
    (data) => data.amount <= maxRefundAmount,
    {
      message: `Refund amount cannot exceed the remaining amount: $${maxRefundAmount.toFixed(2)}`,
      path: ["amount"],
    }
  );

  const form = useForm<RefundFormData>({
    resolver: zodResolver(dynamicRefundFormSchema),
    defaultValues: {
      amount: 0,
      reason: "",
    },
  });

  // Update form values when refund info loads or dialog opens
  useEffect(() => {
    if (open && !isLoadingRefundInfo) {
      form.reset({
        amount: maxRefundAmount,
        reason: "",
      });
    }
  }, [open, maxRefundAmount, isLoadingRefundInfo, form]);

  const onSubmit = async (data: RefundFormData) => {
    console.log("Submitting refund:", {
      paymentId: payment.id,
      refundAmount: data.amount,
      reason: data.reason,
      maxRefundAmount,
      currentRefundAmount,
    });

    try {
      const result = await processRefundMutation.mutateAsync({
        paymentId: payment.id,
        refundAmount: data.amount,
        reason: data.reason,
      });

      console.log("Refund processed successfully:", result);
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error("Refund processing failed:", error);
      // Error handling is done in the mutation, but log for debugging
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Process Refund
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Payment Information */}
            <div className="bg-muted/50 rounded-lg border p-4">
              <h4 className="mb-3 font-medium">Payment Information</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Receipt:</span>
                  <span className="ml-2 font-mono">
                    {payment.receipt_number}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="ml-2 font-medium">
                    ${payment.amount.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Method:</span>
                  <span className="ml-2">{payment.payment_method}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="outline" className="ml-2">
                    {payment.payment_status}
                  </Badge>
                </div>
                {"reference_number" in payment && payment.reference_number && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Reference:</span>
                    <span className="ml-2 font-mono text-sm">
                      {payment.reference_number}
                    </span>
                  </div>
                )}
              </div>

              <Separator className="my-3" />

              <div className="space-y-2 text-sm">
                {currentRefundAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-red-600">Already refunded:</span>
                    <span className="font-medium text-red-600">
                      -${currentRefundAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Maximum refund:</span>
                  <span className="font-medium">
                    ${maxRefundAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Previous refunds */}
              {refundInfo?.refunds && refundInfo.refunds.length > 0 && (
                <>
                  <Separator className="my-3" />
                  <div>
                    <h5 className="mb-2 text-sm font-medium">
                      Previous Refunds
                    </h5>
                    <div className="space-y-1 text-xs">
                      {refundInfo.refunds.map((refund) => (
                        <div
                          key={refund.id}
                          className="text-muted-foreground flex justify-between"
                        >
                          <span>
                            {new Date(refund.payment_date).toLocaleDateString()}{" "}
                            - {refund.receipt_number}
                          </span>
                          <span className="font-medium text-red-600">
                            -${Math.abs(refund.amount).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Loading state */}
            {isLoadingRefundInfo && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Loading refund information...
                </AlertDescription>
              </Alert>
            )}

            {/* Warning for zero refund available */}
            {!isLoadingRefundInfo && maxRefundAmount === 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This payment has already been fully refunded. No additional
                  refund is possible.
                </AlertDescription>
              </Alert>
            )}

            {/* Refund Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Refund Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-9"
                        disabled={
                          processRefundMutation.isPending ||
                          isLoadingRefundInfo ||
                          maxRefundAmount === 0
                        }
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Maximum refundable amount: ${maxRefundAmount.toFixed(2)}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Refund Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Refund Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain the reason for this refund..."
                      className="resize-none"
                      disabled={
                        processRefundMutation.isPending || isLoadingRefundInfo
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a clear reason for the refund (required)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Warning about refund processing */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> Refunds cannot be undone. Please
                ensure the refund amount and reason are correct before
                proceeding.
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                variant="destructive"
                disabled={
                  processRefundMutation.isPending ||
                  isLoadingRefundInfo ||
                  maxRefundAmount === 0
                }
                className="flex-1"
              >
                {processRefundMutation.isPending
                  ? "Processing..."
                  : isLoadingRefundInfo
                    ? "Loading..."
                    : "Process Refund"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={
                  processRefundMutation.isPending || isLoadingRefundInfo
                }
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
