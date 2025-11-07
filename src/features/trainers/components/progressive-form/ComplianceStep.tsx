import { memo } from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { FormStepProps } from "./types";

export const ComplianceStep = memo(function ComplianceStep({
  form,
}: FormStepProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Optional:</strong> Safety compliance and additional trainer
          information.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="insurance_policy_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Insurance Policy Number</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="POL-123456789"
                  className="h-12"
                />
              </FormControl>
              <FormDescription>
                Professional liability insurance policy number
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="background_check_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Background Check Date</FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value ? new Date(field.value) : new Date()}
                  onChange={(date) =>
                    field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                  }
                  placeholder="Select date (defaults to today)"
                  className="h-12 w-full"
                  showYearMonthPickers={true}
                  yearRange={{
                    from: 1990,
                    to: new Date().getFullYear(),
                  }}
                />
              </FormControl>
              <FormDescription>
                Date when background check was completed (defaults to today)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cpr_certification_expires"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CPR Certification Expires</FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value ? new Date(field.value) : undefined}
                  onChange={(date) =>
                    field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                  }
                  placeholder="Select expiry date"
                  className="h-12 w-full"
                />
              </FormControl>
              <FormDescription>
                CPR/First Aid certification expiration date
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Internal Notes</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Add any internal staff notes about this trainer..."
                className="min-h-[100px] resize-none"
                {...field}
              />
            </FormControl>
            <FormDescription>
              Notes visible only to staff members.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
});
