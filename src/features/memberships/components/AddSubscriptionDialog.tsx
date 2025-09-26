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
import { Checkbox } from "@/components/ui/checkbox";

import {
  createSubscriptionSchema,
  type CreateSubscriptionData,
} from "@/features/memberships/lib/validation";
import {
  useSubscriptionPlans,
  useCreateSubscription,
} from "@/features/memberships/hooks/use-subscriptions";
import { AdvancedMemberSearch } from "@/features/members/components/AdvancedMemberSearch";
import { cn } from "@/lib/utils";
import type { PaymentMethod, Member } from "@/features/database/lib/types";

interface AddSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSubscriptionDialog({
  open,
  onOpenChange,
}: AddSubscriptionDialogProps) {
  const { data: plans, isLoading: isLoadingPlans } = useSubscriptionPlans();
  const createSubscriptionMutation = useCreateSubscription();
  const [selectedMember, setSelectedMember] = React.useState<Member | null>(
    null
  );

  const form = useForm({
    resolver: zodResolver(createSubscriptionSchema),
    defaultValues: {
      member_id: "",
      plan_id: "",
      start_date: new Date().toISOString(),
      initial_payment_amount: 0,
      payment_method: "cash" as PaymentMethod,
      include_signup_fee: true,
      signup_fee_paid: 0,
      notes: "",
    },
  });

  const watchedPlanId = form.watch("plan_id");
  const watchedInitialPayment = form.watch("initial_payment_amount");
  const watchedIncludeSignupFee = form.watch("include_signup_fee");
  const watchedSignupFeePaid = form.watch("signup_fee_paid");

  const selectedPlan = plans?.find((p) => p.id === watchedPlanId);

  const sessionInfo = selectedPlan
    ? {
        totalSessions: selectedPlan.sessions_count || 0,
        pricePerSession: selectedPlan.sessions_count
          ? selectedPlan.price / selectedPlan.sessions_count
          : 0,
        duration: 30, // Default duration since billing cycle is removed
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
    if (watchedIncludeSignupFee && selectedPlan) {
      form.setValue("signup_fee_paid", selectedPlan.signup_fee);
    } else {
      form.setValue("signup_fee_paid", 0);
    }
  }, [watchedIncludeSignupFee, selectedPlan, form]);

  const handleMemberSelect = (member: Member) => {
    setSelectedMember(member);
    form.setValue("member_id", member.id);
  };

  const onSubmit = async (data: CreateSubscriptionData) => {
    try {
      await createSubscriptionMutation.mutateAsync(data);
      form.reset();
      setSelectedMember(null);
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
            Create a new subscription for a member
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            role="form"
          >
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
                    Select the member for this subscription
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Selected Member Info */}
            {selectedMember && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        Selected Member:
                      </span>
                      <span className="font-medium">
                        {selectedMember.first_name} {selectedMember.last_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        Email:
                      </span>
                      <span className="text-sm">{selectedMember.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        Phone:
                      </span>
                      <span className="text-sm">
                        {selectedMember.phone || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        Status:
                      </span>
                      <span className="text-sm capitalize">
                        {selectedMember.status}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
                disabled={
                  createSubscriptionMutation.isPending ||
                  !selectedPlan ||
                  !selectedMember
                }
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
