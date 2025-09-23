"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import {
  createSubscriptionSchema,
  type CreateSubscriptionData,
} from "@/features/memberships/lib/validation";
import {
  useSubscriptionPlans,
  useCreateSubscription,
} from "@/features/memberships/hooks/use-subscriptions";
import { cn } from "@/lib/utils";
import type { Member, PaymentMethod } from "@/features/database/lib/types";

interface NewSubscriptionDialogProps {
  member: Member;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewSubscriptionDialog({
  member,
  open,
  onOpenChange,
}: NewSubscriptionDialogProps) {
  const { data: plans, isLoading: isLoadingPlans } = useSubscriptionPlans();
  const createSubscriptionMutation = useCreateSubscription();

  const form = useForm({
    resolver: zodResolver(createSubscriptionSchema),
    defaultValues: {
      member_id: member.id,
      plan_id: "",
      start_date: new Date().toISOString(),
      initial_payment_amount: 0,
      payment_method: "cash" as PaymentMethod,
      notes: "",
    },
  });

  const watchedPlanId = form.watch("plan_id");
  const watchedInitialPayment = form.watch("initial_payment_amount");

  const selectedPlan = plans?.find((p) => p.id === watchedPlanId);

  const sessionInfo = selectedPlan
    ? {
        totalSessions: selectedPlan.sessions_count || 0,
        pricePerSession: selectedPlan.sessions_count
          ? selectedPlan.price / selectedPlan.sessions_count
          : 0,
        duration: selectedPlan.contract_length_months
          ? selectedPlan.contract_length_months * 30
          : 30,
      }
    : null;

  const balanceInfo = selectedPlan
    ? {
        totalPrice: selectedPlan.price,
        initialPayment: watchedInitialPayment || 0,
        remainingBalance: Math.max(
          0,
          selectedPlan.price - (watchedInitialPayment || 0)
        ),
        isFullyPaid: (watchedInitialPayment || 0) >= selectedPlan.price,
      }
    : null;

  const onSubmit = async (data: CreateSubscriptionData) => {
    try {
      await createSubscriptionMutation.mutateAsync(data);
      form.reset();
      onOpenChange(false);
    } catch {
      // Error handling is done in the mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Subscription</DialogTitle>
          <DialogDescription>
            Create a new subscription for {member.first_name} {member.last_name}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            role="form"
          >
            {/* Plan Selection */}
            <FormField
              control={form.control}
              name="plan_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subscription Plan</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingPlans ? (
                        <div className="p-2">
                          <Skeleton className="h-8 w-full" />
                        </div>
                      ) : (
                        plans?.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            <div className="flex w-full items-center justify-between">
                              <span>{plan.name}</span>
                              <span className="ml-4 font-bold">
                                ${plan.price}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Plan Details */}
            {selectedPlan && sessionInfo && (
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground text-sm">Sessions</p>
                      <p className="font-bold">{sessionInfo.totalSessions}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Duration</p>
                      <p className="font-bold">{sessionInfo.duration} days</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">
                        Total Price
                      </p>
                      <p className="font-bold">
                        ${selectedPlan.price.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">
                        Per Session
                      </p>
                      <p className="font-bold">
                        ${sessionInfo.pricePerSession.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Start Date */}
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
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
                            format(new Date(field.value), "PPP")
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
                        selected={
                          field.value ? new Date(field.value) : undefined
                        }
                        onSelect={(date) => field.onChange(date?.toISOString())}
                        disabled={(date) => date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    When the subscription should start
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Initial Payment */}
            <FormField
              control={form.control}
              name="initial_payment_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Payment</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Amount to collect now (can be partial payment)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Breakdown */}
            {balanceInfo && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Plan Price:</span>
                      <span className="font-medium">
                        ${balanceInfo.totalPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Initial Payment:</span>
                      <span className="font-medium">
                        ${balanceInfo.initialPayment.toFixed(2)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span>Remaining Balance:</span>
                      <span
                        className={cn(
                          "font-bold",
                          balanceInfo.remainingBalance > 0
                            ? "text-orange-600"
                            : "text-green-600"
                        )}
                      >
                        ${balanceInfo.remainingBalance.toFixed(2)}
                      </span>
                    </div>
                    {balanceInfo.isFullyPaid && (
                      <p className="text-sm text-green-600">✓ Fully paid</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Method */}
            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
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

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this subscription..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional notes or special instructions
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={createSubscriptionMutation.isPending || !selectedPlan}
                className="flex-1"
              >
                {createSubscriptionMutation.isPending
                  ? "Creating..."
                  : "Create Subscription"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createSubscriptionMutation.isPending}
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
