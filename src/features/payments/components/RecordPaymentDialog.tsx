"use client";

import React, { useState } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { AdvancedMemberSearch } from "@/features/members/components/AdvancedMemberSearch";
import { useMemberSubscriptionHistory } from "@/features/memberships/hooks/use-subscriptions";
import { paymentUtils } from "@/features/payments/lib/payment-utils";
import type {
  Member,
  PartialMember,
  PaymentMethod,
} from "@/features/database/lib/types";

const recordPaymentSchema = z.object({
  member_id: z.string().min(1, "Please select a member"),
  subscription_id: z.string().optional(),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  paymentMethod: z.enum(["cash", "card", "bank_transfer", "online", "check"]),
  paymentDate: z.date(),
  referenceNumber: z.string().optional(),
  notes: z
    .string()
    .max(500, "Notes must be less than 500 characters")
    .optional(),
});

type RecordPaymentFormData = z.infer<typeof recordPaymentSchema>;

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedMember?: PartialMember | null;
  preSelectedSubscriptionId?: string | null;
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  preSelectedMember,
  preSelectedSubscriptionId,
}: RecordPaymentDialogProps) {
  const [selectedMember, setSelectedMember] = useState<PartialMember | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch member subscriptions when member is selected
  const { data: memberSubscriptions, isLoading: isLoadingSubscriptions } =
    useMemberSubscriptionHistory(selectedMember?.id || "");

  const form = useForm<RecordPaymentFormData>({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: {
      member_id: "",
      subscription_id: "",
      amount: 0,
      paymentMethod: "cash",
      paymentDate: new Date(),
      referenceNumber: "",
      notes: "",
    },
  });

  const onSubmit = async (data: RecordPaymentFormData) => {
    if (!selectedMember) {
      form.setError("member_id", { message: "Please select a member" });
      return;
    }

    setIsSubmitting(true);
    try {
      await paymentUtils.recordPayment({
        member_id: selectedMember.id,
        subscription_id: data.subscription_id || undefined,
        amount: data.amount,
        payment_method: data.paymentMethod as PaymentMethod,
        payment_date: data.paymentDate.toISOString(),
        reference_number: data.referenceNumber || undefined,
        notes: data.notes || undefined,
      });

      // Reset form and close dialog
      form.reset();
      setSelectedMember(null);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to record payment:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));

      let errorMessage = "Failed to record payment";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "object" && error !== null) {
        errorMessage = JSON.stringify(error);
      }

      form.setError("root", {
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMemberSelect = (member: Member) => {
    setSelectedMember(member);
    form.setValue("member_id", member.id);
  };

  // Handle pre-selected member
  React.useEffect(() => {
    if (preSelectedMember && open) {
      setSelectedMember(preSelectedMember);
      form.setValue("member_id", preSelectedMember.id);
    }
  }, [preSelectedMember, open, form]);

  // Handle pre-selected subscription
  React.useEffect(() => {
    if (preSelectedSubscriptionId && open) {
      form.setValue("subscription_id", preSelectedSubscriptionId);
    }
  }, [preSelectedSubscriptionId, open, form]);

  const handleDialogClose = () => {
    form.reset();
    setSelectedMember(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Member Selection */}
            <FormField
              control={form.control}
              name="member_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Member</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      {!selectedMember ? (
                        <AdvancedMemberSearch
                          onMemberSelect={handleMemberSelect}
                          placeholder="Search and select a member..."
                        />
                      ) : (
                        <div className="bg-muted/50 rounded-lg border p-3">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">
                              {selectedMember.first_name}{" "}
                              {selectedMember.last_name}
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedMember(null);
                                field.onChange("");
                              }}
                            >
                              Change
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Select the member this payment is for
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Enter the amount received from the member
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Subscription Selection */}
            {selectedMember && (
              <FormField
                control={form.control}
                name="subscription_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subscription (Optional)</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === "none" ? "" : value)
                      }
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a subscription or leave empty" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">
                          No subscription (standalone payment)
                        </SelectItem>
                        {isLoadingSubscriptions ? (
                          <div className="p-2">
                            <div className="bg-muted h-8 w-full animate-pulse rounded" />
                          </div>
                        ) : (
                          memberSubscriptions?.map((subscription) => (
                            <SelectItem
                              key={subscription.id}
                              value={subscription.id}
                            >
                              <div className="flex w-full items-center justify-between">
                                <span>{subscription.plan_name_snapshot}</span>
                                <span className="text-muted-foreground ml-4 text-sm">
                                  {subscription.status} - $
                                  {subscription.total_amount_snapshot}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Optionally link this payment to a specific subscription
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Payment Method */}
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Credit/Debit Card</SelectItem>
                      <SelectItem value="bank_transfer">
                        Bank Transfer
                      </SelectItem>
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
                    Optional reference for tracking (transaction ID, check
                    number, etc.)
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
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Recording..." : "Record Payment"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleDialogClose}
                disabled={isSubmitting}
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
