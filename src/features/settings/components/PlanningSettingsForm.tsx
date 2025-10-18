/**
 * Planning Settings Form
 * Form for configuring studio planning parameters
 */

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Hourglass, Scale, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { usePlanningSettings } from "../hooks/use-planning-settings";

const formSchema = z.object({
  subscription_warning_days: z
    .number()
    .min(1, "Must be at least 1")
    .max(999, "Must be at most 999"),
  body_checkup_sessions: z
    .number()
    .min(1, "Must be at least 1")
    .max(999, "Must be at most 999"),
  payment_reminder_days: z
    .number()
    .min(1, "Must be at least 1")
    .max(999, "Must be at most 999"),
  max_sessions_per_week: z
    .number()
    .min(1, "Must be at least 1")
    .max(9999, "Must be at most 9999"),
  inactivity_months: z
    .number()
    .min(1, "Must be at least 1")
    .max(99, "Must be at most 99"),
});

type FormValues = z.infer<typeof formSchema>;

export function PlanningSettingsForm() {
  const { settings, isLoading, updateSettings, isUpdating } =
    usePlanningSettings();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: settings
      ? {
          subscription_warning_days: settings.subscription_warning_days,
          body_checkup_sessions: settings.body_checkup_sessions,
          payment_reminder_days: settings.payment_reminder_days,
          max_sessions_per_week: settings.max_sessions_per_week,
          inactivity_months: settings.inactivity_months,
        }
      : undefined,
  });

  const onSubmit = async (values: FormValues) => {
    await updateSettings(values);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Subscription Warning */}
        <FormField
          control={form.control}
          name="subscription_warning_days"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subscription Expiration Warning</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) || 0)
                    }
                    className="max-w-[200px]"
                  />
                  <Hourglass className="h-6 w-6 text-red-500" />
                </div>
              </FormControl>
              <FormDescription>
                Show warning this many days before subscription ends
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Body Checkup Reminder */}
        <FormField
          control={form.control}
          name="body_checkup_sessions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Body Checkup Reminder</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) || 0)
                    }
                    className="max-w-[200px]"
                  />
                  <Scale className="h-6 w-6 text-yellow-500" />
                </div>
              </FormControl>
              <FormDescription>
                Sessions after last checkup to show reminder
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Payment Reminder */}
        <FormField
          control={form.control}
          name="payment_reminder_days"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Reminder</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) || 0)
                    }
                    className="max-w-[200px]"
                  />
                  <Coins className="h-6 w-6 text-green-500" />
                </div>
              </FormControl>
              <FormDescription>
                Days after last payment to show reminder
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Maximum Sessions Per Week */}
        <FormField
          control={form.control}
          name="max_sessions_per_week"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maximum Sessions Per Week</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseInt(e.target.value) || 0)
                  }
                  className="max-w-[200px]"
                />
              </FormControl>
              <FormDescription>
                Studio-wide booking limit per week
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Auto-Inactivation Threshold */}
        <FormField
          control={form.control}
          name="inactivity_months"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Auto-Inactivation Threshold</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseInt(e.target.value) || 0)
                  }
                  className="max-w-[200px]"
                />
              </FormControl>
              <FormDescription>
                Months without attendance before auto-inactivation
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isUpdating}>
            {isUpdating ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
