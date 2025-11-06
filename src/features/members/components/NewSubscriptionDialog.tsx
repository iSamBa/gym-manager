"use client";

import React, { useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";

import {
  createSubscriptionSchema,
  type CreateSubscriptionData,
} from "@/features/memberships/lib/validation";
import {
  useActiveSubscriptionPlans,
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
  const { data: plans, isLoading: isLoadingPlans } =
    useActiveSubscriptionPlans();
  const createSubscriptionMutation = useCreateSubscription();

  // Filter plans based on member type
  // Collaboration members can only use collaboration plans
  // Regular members (trial/full) can only use regular plans
  const filteredPlans = useMemo(() => {
    if (!plans) return [];

    // For collaboration members, show only collaboration plans
    if (member.member_type === "collaboration") {
      return plans.filter((plan) => plan.is_collaboration_plan === true);
    }

    // For regular members (trial/full), show only non-collaboration plans
    return plans.filter((plan) => plan.is_collaboration_plan === false);
  }, [plans, member.member_type]);

  const form = useForm({
    resolver: zodResolver(createSubscriptionSchema),
    defaultValues: {
      member_id: member.id,
      plan_id: "",
      start_date: new Date().toISOString(),
      initial_payment_amount: undefined,
      payment_method: "cash" as PaymentMethod,
      include_signup_fee: true,
      signup_fee_paid: undefined,
      notes: "",
    },
  });

  const watchedPlanId = form.watch("plan_id");
  const watchedInitialPayment = form.watch("initial_payment_amount");
  const watchedIncludeSignupFee = form.watch("include_signup_fee");
  const watchedSignupFeePaid = form.watch("signup_fee_paid");

  const selectedPlan = filteredPlans?.find((p) => p.id === watchedPlanId);

  const sessionInfo = selectedPlan
    ? {
        totalSessions: selectedPlan.sessions_count || 0,
        pricePerSession: selectedPlan.sessions_count
          ? selectedPlan.price / selectedPlan.sessions_count
          : 0,
        duration: selectedPlan.duration_months * 30, // Calculate days from months
      }
    : null;

  const balanceInfo = selectedPlan
    ? {
        planPrice: selectedPlan.price,
        signupFee: watchedIncludeSignupFee ? selectedPlan.signup_fee : 0,
        totalPrice:
          selectedPlan.price +
          (watchedIncludeSignupFee ? selectedPlan.signup_fee : 0),
        initialPayment: watchedInitialPayment || 0,
        signupFeePaid: watchedIncludeSignupFee ? watchedSignupFeePaid || 0 : 0,
        totalPaid:
          (watchedInitialPayment || 0) +
          (watchedIncludeSignupFee ? watchedSignupFeePaid || 0 : 0),
        remainingBalance: Math.max(
          0,
          selectedPlan.price +
            (watchedIncludeSignupFee ? selectedPlan.signup_fee : 0) -
            ((watchedInitialPayment || 0) +
              (watchedIncludeSignupFee ? watchedSignupFeePaid || 0 : 0))
        ),
        isFullyPaid:
          (watchedInitialPayment || 0) +
            (watchedIncludeSignupFee ? watchedSignupFeePaid || 0 : 0) >=
          selectedPlan.price +
            (watchedIncludeSignupFee ? selectedPlan.signup_fee : 0),
      }
    : null;

  // Effect to auto-set signup fee paid when checkbox is checked
  React.useEffect(() => {
    if (watchedIncludeSignupFee && selectedPlan && watchedSignupFeePaid === 0) {
      form.setValue("signup_fee_paid", selectedPlan.signup_fee);
    } else if (!watchedIncludeSignupFee) {
      form.setValue("signup_fee_paid", 0);
    }
  }, [watchedIncludeSignupFee, selectedPlan, watchedSignupFeePaid, form]);

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
                      ) : filteredPlans.length === 0 ? (
                        <div className="text-muted-foreground p-2 text-sm">
                          {member.member_type === "collaboration"
                            ? "No collaboration plans available. Create a collaboration plan first."
                            : "No subscription plans available."}
                        </div>
                      ) : (
                        filteredPlans.map((plan) => (
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
                      <p className="font-bold">
                        {selectedPlan.duration_months} months (
                        {sessionInfo.duration} days)
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">
                        Plan Price
                      </p>
                      <p className="font-bold">
                        ${selectedPlan.price.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">
                        Signup Fee
                      </p>
                      <p className="font-bold">
                        ${selectedPlan.signup_fee.toFixed(2)}
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

            {/* Signup Fee Section */}
            {selectedPlan && selectedPlan.signup_fee > 0 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="include_signup_fee"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Include signup fee ($
                          {selectedPlan.signup_fee.toFixed(2)})
                        </FormLabel>
                        <FormDescription>
                          Check this for new subscriptions. Uncheck for upgrades
                          or renewals.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {watchedIncludeSignupFee && (
                  <FormField
                    control={form.control}
                    name="signup_fee_paid"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Signup Fee Payment</FormLabel>
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
                          Amount of signup fee paid (max: $
                          {selectedPlan.signup_fee.toFixed(2)})
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
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
                        ${balanceInfo.planPrice.toFixed(2)}
                      </span>
                    </div>
                    {balanceInfo.signupFee > 0 && (
                      <div className="flex justify-between">
                        <span>Signup Fee:</span>
                        <span className="font-medium">
                          ${balanceInfo.signupFee.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Total Price:</span>
                      <span className="font-bold">
                        ${balanceInfo.totalPrice.toFixed(2)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span>Plan Payment:</span>
                      <span className="font-medium">
                        ${balanceInfo.initialPayment.toFixed(2)}
                      </span>
                    </div>
                    {balanceInfo.signupFeePaid > 0 && (
                      <div className="flex justify-between">
                        <span>Signup Fee Paid:</span>
                        <span className="font-medium">
                          ${balanceInfo.signupFeePaid.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Total Paid:</span>
                      <span className="font-bold">
                        ${balanceInfo.totalPaid.toFixed(2)}
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
