# Epic 3: Payment System

## Overview

Implement comprehensive payment tracking with receipt generation, flexible payment schedules, and seamless integration with the subscription system using shadcn/ui components.

## Technical Requirements

### 3.1 Payment Utilities

**src/features/payments/lib/payment-utils.ts**

```typescript
import { supabase } from "@/lib/supabase";
import type {
  SubscriptionPaymentWithReceipt,
  RecordPaymentInput,
  MemberSubscriptionWithSnapshot,
  PaymentMethod,
} from "@/features/database/lib/types";

export const paymentUtils = {
  /**
   * Record a payment for a subscription
   */
  async recordPayment(
    input: RecordPaymentInput
  ): Promise<SubscriptionPaymentWithReceipt> {
    // Get the subscription to verify member_id
    const { data: subscription, error: subError } = await supabase
      .from("member_subscriptions")
      .select("member_id, total_amount_snapshot, paid_amount")
      .eq("id", input.subscription_id)
      .single();

    if (subError) throw subError;

    const paymentData = {
      subscription_id: input.subscription_id,
      member_id: subscription.member_id,
      amount: input.amount,
      payment_method: input.payment_method,
      payment_date: input.payment_date || new Date().toISOString(),
      payment_status: "completed" as const,
      reference_number: input.reference_number,
      notes: input.notes,
      created_by: (await supabase.auth.getUser()).data.user?.id,
    };

    const { data, error } = await supabase
      .from("subscription_payments")
      .insert(paymentData)
      .select()
      .single();

    if (error) throw error;

    // Update subscription paid_amount
    await this.updateSubscriptionPaidAmount(input.subscription_id);

    return data as SubscriptionPaymentWithReceipt;
  },

  /**
   * Update the total paid amount for a subscription
   */
  async updateSubscriptionPaidAmount(subscriptionId: string) {
    // Calculate total paid from all completed payments
    const { data: payments, error: paymentsError } = await supabase
      .from("subscription_payments")
      .select("amount")
      .eq("subscription_id", subscriptionId)
      .eq("payment_status", "completed");

    if (paymentsError) throw paymentsError;

    const totalPaid = payments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    const { error } = await supabase
      .from("member_subscriptions")
      .update({
        paid_amount: totalPaid,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscriptionId);

    if (error) throw error;

    return totalPaid;
  },

  /**
   * Get all payments for a subscription
   */
  async getSubscriptionPayments(
    subscriptionId: string
  ): Promise<SubscriptionPaymentWithReceipt[]> {
    const { data, error } = await supabase
      .from("subscription_payments")
      .select("*")
      .eq("subscription_id", subscriptionId)
      .order("payment_date", { ascending: false });

    if (error) throw error;
    return data as SubscriptionPaymentWithReceipt[];
  },

  /**
   * Get all payments for a member across all subscriptions
   */
  async getMemberPayments(
    memberId: string
  ): Promise<SubscriptionPaymentWithReceipt[]> {
    const { data, error } = await supabase
      .from("subscription_payments")
      .select(
        `
        *,
        member_subscriptions!inner(plan_name_snapshot)
      `
      )
      .eq("member_id", memberId)
      .order("payment_date", { ascending: false });

    if (error) throw error;
    return data as SubscriptionPaymentWithReceipt[];
  },

  /**
   * Calculate balance information for a subscription
   */
  calculateBalanceInfo(subscription: MemberSubscriptionWithSnapshot) {
    const totalAmount = subscription.total_amount_snapshot;
    const paidAmount = subscription.paid_amount;
    const balance = Math.max(0, totalAmount - paidAmount);
    const paidPercentage =
      totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

    return {
      totalAmount,
      paidAmount,
      balance,
      paidPercentage,
      isFullyPaid: balance === 0,
      isOverpaid: paidAmount > totalAmount,
    };
  },

  /**
   * Process a refund for a payment
   */
  async processRefund(paymentId: string, refundAmount: number, reason: string) {
    const { data: payment, error: fetchError } = await supabase
      .from("subscription_payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (fetchError) throw fetchError;

    if (refundAmount > payment.amount) {
      throw new Error("Refund amount cannot exceed original payment amount");
    }

    const { data, error } = await supabase
      .from("subscription_payments")
      .update({
        refund_amount: refundAmount,
        refund_date: new Date().toISOString(),
        refund_reason: reason,
        payment_status:
          refundAmount === payment.amount ? "refunded" : "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentId)
      .select()
      .single();

    if (error) throw error;

    // Update subscription paid amount
    await this.updateSubscriptionPaidAmount(payment.subscription_id);

    return data as SubscriptionPaymentWithReceipt;
  },

  /**
   * Get payment statistics for reporting
   */
  async getPaymentStats(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from("subscription_payments")
      .select("amount, payment_method, payment_date")
      .gte("payment_date", startDate)
      .lte("payment_date", endDate)
      .eq("payment_status", "completed");

    if (error) throw error;

    const stats = {
      totalRevenue: data.reduce((sum, payment) => sum + payment.amount, 0),
      paymentCount: data.length,
      averagePayment:
        data.length > 0
          ? data.reduce((sum, payment) => sum + payment.amount, 0) / data.length
          : 0,
      paymentMethodBreakdown: data.reduce(
        (acc, payment) => {
          acc[payment.payment_method] =
            (acc[payment.payment_method] || 0) + payment.amount;
          return acc;
        },
        {} as Record<PaymentMethod, number>
      ),
    };

    return stats;
  },
};
```

### 3.2 Payment Hooks

**src/features/payments/hooks/use-payments.ts**

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentUtils } from "../lib/payment-utils";
import type { RecordPaymentInput } from "@/features/database/lib/types";
import { subscriptionKeys } from "@/features/memberships/hooks/use-subscriptions";
import { toast } from "sonner";

// Query key factory for payment-related queries
export const paymentKeys = {
  all: ["payments"] as const,
  lists: () => [...paymentKeys.all, "list"] as const,
  subscription: (subscriptionId: string) =>
    [...paymentKeys.all, "subscription", subscriptionId] as const,
  member: (memberId: string) =>
    [...paymentKeys.all, "member", memberId] as const,
  stats: (startDate: string, endDate: string) =>
    [...paymentKeys.all, "stats", startDate, endDate] as const,
};

/**
 * Get payments for a specific subscription
 */
export function useSubscriptionPayments(subscriptionId: string) {
  return useQuery({
    queryKey: paymentKeys.subscription(subscriptionId),
    queryFn: () => paymentUtils.getSubscriptionPayments(subscriptionId),
    enabled: !!subscriptionId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get all payments for a member
 */
export function useMemberPayments(memberId: string) {
  return useQuery({
    queryKey: paymentKeys.member(memberId),
    queryFn: () => paymentUtils.getMemberPayments(memberId),
    enabled: !!memberId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Get payment statistics for a date range
 */
export function usePaymentStats(startDate: string, endDate: string) {
  return useQuery({
    queryKey: paymentKeys.stats(startDate, endDate),
    queryFn: () => paymentUtils.getPaymentStats(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000, // 5 minutes for stats
  });
}

/**
 * Record a new payment
 */
export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RecordPaymentInput) =>
      paymentUtils.recordPayment(input),

    onSuccess: (data, variables) => {
      // Invalidate payment queries
      queryClient.invalidateQueries({
        queryKey: paymentKeys.subscription(variables.subscription_id),
      });

      // Get member_id from the returned data or fetch it
      if (data.member_id) {
        queryClient.invalidateQueries({
          queryKey: paymentKeys.member(data.member_id),
        });
      }

      // Invalidate subscription queries to update paid amount
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.detail(variables.subscription_id),
      });

      toast.success("Payment Recorded", {
        description: `Payment of $${variables.amount.toFixed(2)} recorded successfully. Receipt: ${data.receipt_number}`,
      });
    },

    onError: (error) => {
      toast.error("Payment Failed", {
        description:
          error instanceof Error ? error.message : "Failed to record payment",
      });
    },
  });
}

/**
 * Process a refund
 */
export function useProcessRefund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      paymentId,
      refundAmount,
      reason,
    }: {
      paymentId: string;
      refundAmount: number;
      reason: string;
    }) => paymentUtils.processRefund(paymentId, refundAmount, reason),

    onSuccess: (data) => {
      // Invalidate payment queries
      queryClient.invalidateQueries({
        queryKey: paymentKeys.subscription(data.subscription_id),
      });

      queryClient.invalidateQueries({
        queryKey: paymentKeys.member(data.member_id),
      });

      // Invalidate subscription queries
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.detail(data.subscription_id),
      });

      toast.success("Refund Processed", {
        description: `Refund of $${data.refund_amount?.toFixed(2)} has been processed.`,
      });
    },

    onError: (error) => {
      toast.error("Refund Failed", {
        description:
          error instanceof Error ? error.message : "Failed to process refund",
      });
    },
  });
}
```

### 3.3 Payment Form Component

**src/features/payments/components/PaymentForm.tsx**

```typescript
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useRecordPayment } from '../hooks/use-payments';
import type { PaymentMethod, MemberSubscriptionWithSnapshot } from '@/features/database/lib/types';

const paymentFormSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  paymentMethod: z.enum(['cash', 'card', 'bank_transfer', 'online', 'check']) as z.ZodEnum<[PaymentMethod, ...PaymentMethod[]]>,
  paymentDate: z.date(),
  referenceNumber: z.string().optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

interface PaymentFormProps {
  subscription: MemberSubscriptionWithSnapshot;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PaymentForm({ subscription, onSuccess, onCancel }: PaymentFormProps) {
  const recordPaymentMutation = useRecordPayment();

  const remainingBalance = Math.max(0, subscription.total_amount_snapshot - subscription.paid_amount);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: remainingBalance > 0 ? remainingBalance : 0,
      paymentMethod: 'cash',
      paymentDate: new Date(),
      referenceNumber: '',
      notes: '',
    },
  });

  const onSubmit = async (data: PaymentFormData) => {
    try {
      await recordPaymentMutation.mutateAsync({
        subscription_id: subscription.id,
        amount: data.amount,
        payment_method: data.paymentMethod,
        payment_date: data.paymentDate.toISOString(),
        reference_number: data.referenceNumber || undefined,
        notes: data.notes || undefined,
      });

      form.reset();
      onSuccess?();
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const watchedAmount = form.watch('amount');
  const willOverpay = watchedAmount > remainingBalance;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Subscription Info */}
        <div className="rounded-lg border p-4 bg-muted/50">
          <h4 className="font-medium mb-2">Subscription Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Plan:</span>
              <span className="ml-2 font-medium">{subscription.plan_name_snapshot}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total:</span>
              <span className="ml-2 font-medium">${subscription.total_amount_snapshot.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Paid:</span>
              <span className="ml-2 font-medium">${subscription.paid_amount.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Balance:</span>
              <span className="ml-2 font-medium text-orange-600">
                ${remainingBalance.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Amount */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Amount</FormLabel>
              <FormControl>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-9"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </FormControl>
              <FormDescription>
                {remainingBalance > 0 ? (
                  `Outstanding balance: $${remainingBalance.toFixed(2)}`
                ) : (
                  'Subscription is fully paid'
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Overpayment Warning */}
        {willOverpay && (
          <Alert>
            <AlertDescription>
              This payment amount (${watchedAmount.toFixed(2)}) exceeds the remaining balance
              (${remainingBalance.toFixed(2)}). The excess will be credited to the account.
            </AlertDescription>
          </Alert>
        )}

        {/* Payment Method */}
        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Method</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Credit/Debit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="online">Online Payment</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Payment Date */}
        <FormField
          control={form.control}
          name="paymentDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Payment Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? (
                        format(field.value, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date('1900-01-01')
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                Date when the payment was received
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Reference Number */}
        <FormField
          control={form.control}
          name="referenceNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reference Number</FormLabel>
              <FormControl>
                <Input
                  placeholder="Transaction ID, check number, etc."
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional reference for tracking (transaction ID, check number, etc.)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes about this payment..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional notes about this payment
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            type="submit"
            disabled={recordPaymentMutation.isPending}
            className="flex-1"
          >
            {recordPaymentMutation.isPending ? 'Recording...' : 'Record Payment'}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={recordPaymentMutation.isPending}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
```

### 3.4 Payment History Component

**src/features/payments/components/PaymentHistoryTable.tsx**

```typescript
'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  MoreHorizontal,
  Receipt,
  Undo2,
  Download,
  Eye
} from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

import type { SubscriptionPaymentWithReceipt } from '@/features/database/lib/types';
import { PaymentReceiptDialog } from './PaymentReceiptDialog';
import { RefundDialog } from './RefundDialog';

interface PaymentHistoryTableProps {
  payments: SubscriptionPaymentWithReceipt[];
  isLoading?: boolean;
  showMemberColumn?: boolean;
  showSubscriptionColumn?: boolean;
}

export function PaymentHistoryTable({
  payments,
  isLoading,
  showMemberColumn = false,
  showSubscriptionColumn = false
}: PaymentHistoryTableProps) {
  const [selectedPayment, setSelectedPayment] = useState<SubscriptionPaymentWithReceipt | null>(null);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!payments.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Receipt}
            title="No payments found"
            description="No payment records available for this period."
          />
        </CardContent>
      </Card>
    );
  }

  const getPaymentMethodBadge = (method: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      cash: 'default',
      card: 'secondary',
      bank_transfer: 'outline',
      online: 'secondary',
      check: 'outline',
    };

    return <Badge variant={variants[method] || 'outline'}>{method.replace('_', ' ')}</Badge>;
  };

  const getStatusBadge = (status: string, refundAmount?: number) => {
    if (status === 'refunded') {
      return <Badge variant="destructive">Refunded</Badge>;
    }
    if (status === 'completed' && refundAmount && refundAmount > 0) {
      return <Badge variant="outline">Partial Refund</Badge>;
    }
    if (status === 'completed') {
      return <Badge variant="default">Completed</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  const handleViewReceipt = (payment: SubscriptionPaymentWithReceipt) => {
    setSelectedPayment(payment);
    setShowReceiptDialog(true);
  };

  const handleRefund = (payment: SubscriptionPaymentWithReceipt) => {
    setSelectedPayment(payment);
    setShowRefundDialog(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Receipt #</TableHead>
                  {showMemberColumn && <TableHead>Member</TableHead>}
                  {showSubscriptionColumn && <TableHead>Plan</TableHead>}
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {payment.payment_date ? format(new Date(payment.payment_date), 'MMM dd, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {payment.receipt_number}
                    </TableCell>
                    {showMemberColumn && (
                      <TableCell>
                        {/* Member name would come from a join or separate query */}
                        Member #{payment.member_id.slice(-8)}
                      </TableCell>
                    )}
                    {showSubscriptionColumn && (
                      <TableCell>
                        {/* Plan name would come from subscription data */}
                        Plan #{payment.subscription_id.slice(-8)}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          ${payment.amount.toFixed(2)}
                        </div>
                        {payment.refund_amount && payment.refund_amount > 0 && (
                          <div className="text-sm text-red-600">
                            -${payment.refund_amount.toFixed(2)} refunded
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPaymentMethodBadge(payment.payment_method)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(payment.payment_status, payment.refund_amount)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewReceipt(payment)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Receipt
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewReceipt(payment)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download Receipt
                          </DropdownMenuItem>
                          {payment.payment_status === 'completed' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleRefund(payment)}
                                className="text-red-600"
                              >
                                <Undo2 className="mr-2 h-4 w-4" />
                                Process Refund
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Receipt Dialog */}
      {selectedPayment && (
        <PaymentReceiptDialog
          payment={selectedPayment}
          open={showReceiptDialog}
          onOpenChange={setShowReceiptDialog}
        />
      )}

      {/* Refund Dialog */}
      {selectedPayment && (
        <RefundDialog
          payment={selectedPayment}
          open={showRefundDialog}
          onOpenChange={setShowRefundDialog}
          onSuccess={() => {
            setShowRefundDialog(false);
            setSelectedPayment(null);
          }}
        />
      )}
    </>
  );
}
```

### 3.5 Payment Receipt Component

**src/features/payments/components/PaymentReceiptDialog.tsx**

```typescript
'use client';

import React from 'react';
import { format } from 'date-fns';
import { Receipt, Download, Print } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

import type { SubscriptionPaymentWithReceipt } from '@/features/database/lib/types';

interface PaymentReceiptDialogProps {
  payment: SubscriptionPaymentWithReceipt;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentReceiptDialog({ payment, open, onOpenChange }: PaymentReceiptDialogProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Implementation for PDF generation would go here
    console.log('Download receipt for:', payment.receipt_number);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Payment Receipt
          </DialogTitle>
        </DialogHeader>

        <Card className="border-2">
          <CardHeader className="text-center bg-muted/50">
            <CardTitle className="text-lg">
              Gym Management System
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Payment Receipt
            </p>
          </CardHeader>

          <CardContent className="space-y-4 pt-6">
            {/* Receipt Number & Date */}
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Receipt Number</p>
                <p className="font-mono font-bold">{payment.receipt_number}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Payment Date</p>
                <p className="font-medium">
                  {payment.payment_date ? format(new Date(payment.payment_date), 'PPP') : 'N/A'}
                </p>
              </div>
            </div>

            <Separator />

            {/* Payment Details */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Paid:</span>
                <span className="font-bold text-lg">${payment.amount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method:</span>
                <Badge variant="outline">
                  {payment.payment_method.replace('_', ' ')}
                </Badge>
              </div>

              {payment.reference_number && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference:</span>
                  <span className="font-mono text-sm">{payment.reference_number}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={payment.payment_status === 'completed' ? 'default' : 'secondary'}>
                  {payment.payment_status}
                </Badge>
              </div>
            </div>

            {/* Refund Information */}
            {payment.refund_amount && payment.refund_amount > 0 && (
              <>
                <Separator />
                <div className="space-y-2 bg-red-50 p-3 rounded-lg">
                  <h4 className="font-medium text-red-800">Refund Information</h4>
                  <div className="flex justify-between">
                    <span className="text-red-700">Refund Amount:</span>
                    <span className="font-bold text-red-800">
                      -${payment.refund_amount.toFixed(2)}
                    </span>
                  </div>
                  {payment.refund_date && (
                    <div className="flex justify-between">
                      <span className="text-red-700">Refund Date:</span>
                      <span className="text-red-800">
                        {format(new Date(payment.refund_date), 'PPP')}
                      </span>
                    </div>
                  )}
                  {payment.refund_reason && (
                    <div>
                      <span className="text-red-700">Reason:</span>
                      <p className="text-red-800 text-sm mt-1">{payment.refund_reason}</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Notes */}
            {payment.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Notes:</p>
                  <p className="text-sm mt-1">{payment.notes}</p>
                </div>
              </>
            )}

            <Separator />

            {/* Footer */}
            <div className="text-center text-xs text-muted-foreground">
              <p>Thank you for your payment!</p>
              <p>Generated on {format(new Date(), 'PPP')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} className="flex-1">
            <Print className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" onClick={handleDownload} className="flex-1">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

## Implementation Checklist

### Core Payment Logic

- [x] Create payment-utils.ts with all payment operations
- [x] Implement receipt number auto-generation
- [x] Add payment balance calculations
- [x] Build refund processing system
- [x] Create payment statistics functions

### React Hooks

- [x] Build payment-specific React Query hooks
- [x] Add proper cache invalidation strategies
- [x] Implement error handling with toast notifications
- [x] Test optimistic updates for payments

### UI Components

- [x] Create PaymentForm with full validation
- [x] Build PaymentHistoryTable with actions
- [x] Create PaymentReceiptDialog for viewing/printing
- [x] Build RefundDialog for processing refunds
- [x] Add payment method icons and styling

### Integration

- [x] Integrate with subscription system
- [x] Add payment balance updates to subscriptions
- [x] Connect with member payment history
- [x] Test payment flow end-to-end

### Testing

- [x] Unit tests for payment utilities
- [x] Test React hooks with MSW mocks
- [x] Test form validation and submission
- [x] Test receipt generation and refund processing
- [x] Integration tests for payment workflows

## Success Criteria

1. Payments can be recorded with auto-generated receipts
2. Subscription balances update automatically
3. Payment history displays correctly
4. Receipt viewing and printing works
5. Refund processing updates all related data
6. Payment statistics calculate correctly
7. Error handling provides clear feedback
8. All shadcn/ui components used correctly
