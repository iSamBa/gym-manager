"use client";

import React, { memo, useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, UserPlus, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
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
import { cn } from "@/lib/utils";
import { formatForDatabase } from "@/lib/date-utils";
import { useCreateMember } from "@/features/members/hooks/use-members";
import { useActiveSubscriptionPlans } from "@/features/memberships/hooks/use-subscriptions";
import { useCreateSubscription } from "@/features/memberships/hooks/use-subscriptions";
import { logger } from "@/lib/logger";

// Validation schema - only essential fields
const quickCollaborationMemberSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  partnership_company: z.string().min(1, "Company name is required"),
  partnership_type: z.enum([
    "influencer",
    "corporate",
    "brand",
    "media",
    "other",
  ]),
  partnership_contract_start: z
    .string()
    .min(1, "Contract start date is required"),
  partnership_notes: z.string().optional(),
  uniform_size: z.enum(["XS", "S", "M", "L", "XL"]),
  vest_size: z.enum(["V1", "V2", "V2_SMALL_EXT", "V3", "V4"]),
  hip_belt_size: z.enum(["V1", "V2"]),
  referral_source: z
    .enum([
      "instagram",
      "member_referral",
      "website_ib",
      "prospection",
      "studio",
      "phone",
      "chatbot",
    ])
    .optional(),
  referred_by_member_id: z.string().optional(),
  subscription_plan_id: z.string().min(1, "Subscription plan is required"),
});

type QuickCollaborationMemberForm = z.infer<
  typeof quickCollaborationMemberSchema
>;

export interface QuickCollaborationMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMemberCreated?: (memberId: string, memberName: string) => void;
}

/**
 * QuickCollaborationMemberDialog - Streamlined form for creating collaboration members during session booking
 *
 * Features:
 * - Essential member information (name, phone, email)
 * - Partnership details (company, type, contract start date)
 * - Equipment information (uniform, vest, hip belt sizes)
 * - Referral tracking (how they heard about us)
 * - Subscription plan selection (collaboration plans only)
 * - Auto-calculates contract end date from start date + subscription duration
 * - Creates member + active subscription in one flow
 * - Returns newly created member ID to parent
 */
export const QuickCollaborationMemberDialog =
  memo<QuickCollaborationMemberDialogProps>(
    function QuickCollaborationMemberDialog({
      open,
      onOpenChange,
      onMemberCreated,
    }) {
      const [isCreating, setIsCreating] = useState(false);

      // Fetch collaboration plans only
      const { data: allPlans = [], isLoading: plansLoading } =
        useActiveSubscriptionPlans();

      const collaborationPlans = useMemo(
        () => allPlans.filter((plan) => plan.is_collaboration_plan === true),
        [allPlans]
      );

      // Mutations
      const createMemberMutation = useCreateMember();
      const createSubscriptionMutation = useCreateSubscription();

      // Form setup
      const form = useForm<QuickCollaborationMemberForm>({
        resolver: zodResolver(quickCollaborationMemberSchema),
        defaultValues: {
          first_name: "",
          last_name: "",
          phone: "",
          email: "",
          partnership_company: "",
          partnership_type: "influencer",
          partnership_contract_start: "",
          partnership_notes: "",
          uniform_size: "M",
          vest_size: "V2",
          hip_belt_size: "V1",
          referral_source: undefined,
          referred_by_member_id: "",
          subscription_plan_id: "",
        },
      });

      const { handleSubmit, reset } = form;

      // Handle form submission
      const onSubmit = useCallback(
        async (data: QuickCollaborationMemberForm) => {
          setIsCreating(true);

          try {
            logger.info("Creating collaboration member", {
              name: `${data.first_name} ${data.last_name}`,
              company: data.partnership_company,
            });

            // Step 1: Get the selected plan details to calculate end date
            const selectedPlan = collaborationPlans.find(
              (plan) => plan.id === data.subscription_plan_id
            );

            if (!selectedPlan) {
              throw new Error("Selected subscription plan not found");
            }

            // Calculate contract end date from start date + subscription duration
            const startDate = new Date(data.partnership_contract_start);
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + selectedPlan.duration_months);

            // Step 2: Create the collaboration member
            const newMember = await createMemberMutation.mutateAsync({
              first_name: data.first_name,
              last_name: data.last_name,
              phone: data.phone,
              email: data.email || undefined,
              member_type: "collaboration",
              status: "active",
              partnership_company: data.partnership_company,
              partnership_type: data.partnership_type,
              partnership_contract_start: data.partnership_contract_start,
              partnership_contract_end: formatForDatabase(endDate),
              partnership_notes: data.partnership_notes || "",
              uniform_size: data.uniform_size,
              vest_size: data.vest_size,
              hip_belt_size: data.hip_belt_size,
              uniform_received: false,
              referral_source: data.referral_source || undefined,
              referred_by_member_id: data.referred_by_member_id || undefined,
              // Set join date to today
              join_date: formatForDatabase(new Date()),
            });

            logger.info("Collaboration member created", {
              memberId: newMember.id,
            });

            // Step 3: Create the subscription
            await createSubscriptionMutation.mutateAsync({
              member_id: newMember.id,
              plan_id: selectedPlan.id,
              start_date: data.partnership_contract_start,
            });

            logger.info("Subscription created for collaboration member", {
              memberId: newMember.id,
              planId: selectedPlan.id,
            });

            toast.success("Collaboration Member Created", {
              description: `${newMember.first_name} ${newMember.last_name} has been added with an active subscription.`,
            });

            // Return the new member ID to parent
            if (onMemberCreated) {
              onMemberCreated(
                newMember.id,
                `${newMember.first_name} ${newMember.last_name}`
              );
            }

            // Reset form and close
            reset();
            onOpenChange(false);
          } catch (error) {
            logger.error("Failed to create collaboration member", {
              error: error instanceof Error ? error.message : String(error),
            });

            toast.error("Failed to Create Member", {
              description:
                error instanceof Error
                  ? error.message
                  : "An unexpected error occurred.",
            });
          } finally {
            setIsCreating(false);
          }
        },
        [
          createMemberMutation,
          createSubscriptionMutation,
          collaborationPlans,
          onMemberCreated,
          reset,
          onOpenChange,
        ]
      );

      // Handle dialog close
      const handleClose = useCallback(() => {
        if (!isCreating) {
          reset();
          onOpenChange(false);
        }
      }, [isCreating, reset, onOpenChange]);

      return (
        <Dialog open={open} onOpenChange={handleClose}>
          <DialogContent className="max-h-[90vh] w-[90vw] overflow-y-auto sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Create Collaboration Member
              </DialogTitle>
              <DialogDescription>
                Quickly add a new collaboration member with an active
                subscription
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Personal Information */}
                <div className="space-y-4 rounded-lg border p-4">
                  <h3 className="text-sm font-semibold">
                    Personal Information
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="John" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Doe" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="+1234567890" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="john@example.com"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Partnership Information */}
                <div className="space-y-4 rounded-lg border p-4">
                  <h3 className="text-sm font-semibold">
                    Partnership Information
                  </h3>

                  <FormField
                    control={form.control}
                    name="partnership_company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company/Brand Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nike, Adidas, etc." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="partnership_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Partnership Type *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="influencer">
                                Influencer
                              </SelectItem>
                              <SelectItem value="corporate">
                                Corporate
                              </SelectItem>
                              <SelectItem value="brand">Brand</SelectItem>
                              <SelectItem value="media">Media</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="partnership_contract_start"
                      render={({ field }) => {
                        const selectedDate = field.value
                          ? new Date(field.value)
                          : undefined;

                        return (
                          <FormItem className="flex flex-col">
                            <FormLabel>Contract Start Date *</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !selectedDate && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {selectedDate
                                      ? format(selectedDate, "PPP")
                                      : "Pick a date"}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={selectedDate}
                                  onSelect={(date) => {
                                    if (date) {
                                      field.onChange(formatForDatabase(date));
                                    }
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="partnership_notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Partnership Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Contract terms, deliverables, etc."
                            rows={3}
                            className="resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Equipment Information */}
                <div className="space-y-4 rounded-lg border p-4">
                  <h3 className="text-sm font-semibold">Equipment & Sizes</h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="uniform_size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Uniform Size *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select size" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="XS">XS</SelectItem>
                              <SelectItem value="S">S</SelectItem>
                              <SelectItem value="M">M</SelectItem>
                              <SelectItem value="L">L</SelectItem>
                              <SelectItem value="XL">XL</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vest_size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vest Size *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select size" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="V1">V1</SelectItem>
                              <SelectItem value="V2">V2</SelectItem>
                              <SelectItem value="V2_SMALL_EXT">
                                V2 Small Ext
                              </SelectItem>
                              <SelectItem value="V3">V3</SelectItem>
                              <SelectItem value="V4">V4</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hip_belt_size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hip Belt Size *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select size" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="V1">V1</SelectItem>
                              <SelectItem value="V2">V2</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Referral Information */}
                <div className="space-y-4 rounded-lg border p-4">
                  <h3 className="text-sm font-semibold">
                    Referral Information
                  </h3>

                  <FormField
                    control={form.control}
                    name="referral_source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>How did they hear about us?</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select source (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="instagram">Instagram</SelectItem>
                            <SelectItem value="member_referral">
                              Member Referral
                            </SelectItem>
                            <SelectItem value="website_ib">
                              Website (IB)
                            </SelectItem>
                            <SelectItem value="prospection">
                              Prospection
                            </SelectItem>
                            <SelectItem value="studio">
                              Studio Walk-in
                            </SelectItem>
                            <SelectItem value="phone">Phone Inquiry</SelectItem>
                            <SelectItem value="chatbot">Chatbot</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Subscription Plan Selection */}
                <div className="space-y-4 rounded-lg border p-4">
                  <h3 className="text-sm font-semibold">Subscription</h3>

                  <FormField
                    control={form.control}
                    name="subscription_plan_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Collaboration Plan *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={plansLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a collaboration plan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {collaborationPlans.map((plan) => (
                              <SelectItem key={plan.id} value={plan.id}>
                                {plan.name} - {plan.sessions_count} sessions (
                                {plan.duration_months} months)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {collaborationPlans.length === 0 && !plansLoading && (
                          <p className="text-sm text-amber-600 dark:text-amber-500">
                            No collaboration plans available. Create one first
                            from the Plans page.
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/20">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      The subscription will start on the selected contract start
                      date. The contract end date will be automatically
                      calculated based on the subscription plan duration.
                    </p>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      isCreating ||
                      collaborationPlans.length === 0 ||
                      plansLoading
                    }
                  >
                    {isCreating && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isCreating ? "Creating..." : "Create Member & Subscribe"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      );
    }
  );

export default QuickCollaborationMemberDialog;
