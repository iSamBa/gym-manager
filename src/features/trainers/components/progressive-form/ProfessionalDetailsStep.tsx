import { memo } from "react";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { FormStepProps } from "./types";

export const ProfessionalDetailsStep = memo(function ProfessionalDetailsStep({
  form,
}: FormStepProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Optional:</strong> Professional details help with scheduling
          and payment processing.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="hourly_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hourly Rate</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  placeholder="50"
                  className="h-12"
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                Standard hourly rate for personal training sessions
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="commission_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Commission Rate (%)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  placeholder="15"
                  className="h-12"
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  value={
                    field.value === undefined || field.value === null
                      ? ""
                      : field.value
                  }
                />
              </FormControl>
              <FormDescription>
                Percentage commission on class and session bookings
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="years_experience"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Years of Experience</FormLabel>
            <FormControl>
              <Input
                type="number"
                {...field}
                placeholder="5"
                className="h-12 sm:max-w-xs"
                onChange={(e) =>
                  field.onChange(
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                value={field.value ?? ""}
              />
            </FormControl>
            <FormDescription>
              Total years of fitness training experience
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
});
