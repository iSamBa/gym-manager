"use client";

import React from "react";
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
import type { SubscriptionPaymentWithReceipt } from "@/features/database/lib/types";

interface RefundDialogProps {
  payment: SubscriptionPaymentWithReceipt;
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

  const currentRefundAmount = payment.refund_amount || 0;
  const maxRefundAmount = payment.amount - currentRefundAmount;

  const form = useForm<RefundFormData>({
    resolver: zodResolver(
      refundFormSchema.refine((data) => data.amount <= maxRefundAmount, {
        message: "Refund amount cannot exceed the remaining amount",
        path: ["amount"],
      })
    ),
    defaultValues: {
      amount: maxRefundAmount,
      reason: "",
    },
  });

  const onSubmit = async (data: RefundFormData) => {
    try {
      await processRefundMutation.mutateAsync({
        paymentId: payment.id,
        refundAmount: data.amount,
        reason: data.reason,
      });

      form.reset();
      onSuccess?.();
    } catch {
      // Error handling is done in the mutation
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
                {payment.reference_number && (
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
            </div>

            {/* Warning for zero refund available */}
            {maxRefundAmount === 0 && (
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
                      disabled={processRefundMutation.isPending}
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
                  processRefundMutation.isPending || maxRefundAmount === 0
                }
                className="flex-1"
              >
                {processRefundMutation.isPending
                  ? "Processing..."
                  : "Process Refund"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={processRefundMutation.isPending}
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
