"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, DollarSign } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useRecordPayment } from "../hooks/use-payments";
import type { MemberSubscriptionWithSnapshot } from "@/features/database/lib/types";

const paymentFormSchema = z.object({
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  paymentMethod: z.enum(["cash", "card", "bank_transfer", "online", "check"]),
  paymentDate: z.date(),
  referenceNumber: z.string().optional(),
  notes: z
    .string()
    .max(500, "Notes must be less than 500 characters")
    .optional(),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

interface PaymentFormProps {
  subscription: MemberSubscriptionWithSnapshot;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PaymentForm({
  subscription,
  onSuccess,
  onCancel,
}: PaymentFormProps) {
  const recordPaymentMutation = useRecordPayment();

  const remainingBalance = Math.max(
    0,
    subscription.total_amount_snapshot - subscription.paid_amount
  );

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: undefined,
      paymentMethod: "cash",
      paymentDate: new Date(),
      referenceNumber: "",
      notes: "",
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
      if (onSuccess) {
        onSuccess();
      }
    } catch {
      // Error handling is done in the mutation
    }
  };

  const watchedAmount = form.watch("amount");
  const willOverpay = watchedAmount > remainingBalance;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Subscription Info */}
        <div className="bg-muted/50 rounded-lg border p-4">
          <h4 className="mb-2 font-medium">Subscription Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Plan:</span>
              <span className="ml-2 font-medium">
                {subscription.plan_name_snapshot}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Total:</span>
              <span className="ml-2 font-medium">
                ${subscription.total_amount_snapshot.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Paid:</span>
              <span className="ml-2 font-medium">
                ${subscription.paid_amount.toFixed(2)}
              </span>
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
                  <DollarSign className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-9"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(
                        value === "" ? undefined : parseFloat(value)
                      );
                    }}
                  />
                </div>
              </FormControl>
              <FormDescription>
                {remainingBalance > 0
                  ? `Outstanding balance: $${remainingBalance.toFixed(2)}`
                  : "Subscription is fully paid"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Overpayment Warning */}
        {willOverpay && (
          <Alert>
            <AlertDescription>
              This payment amount (${watchedAmount.toFixed(2)}) exceeds the
              remaining balance (${remainingBalance.toFixed(2)}). The excess
              will be credited to the account.
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
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
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
                      date > new Date() || date < new Date("1900-01-01")
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
                Optional reference for tracking (transaction ID, check number,
                etc.)
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
            {recordPaymentMutation.isPending
              ? "Recording..."
              : "Record Payment"}
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
