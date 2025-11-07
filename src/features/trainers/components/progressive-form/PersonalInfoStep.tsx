import { memo } from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
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

export const PersonalInfoStep = memo(function PersonalInfoStep({
  form,
}: FormStepProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          key="step1-first-name"
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  id="first_name"
                  placeholder="e.g., John"
                  className="h-12"
                  aria-describedby="first-name-error first-name-help"
                  value={field.value || ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              </FormControl>
              <FormDescription id="first-name-help" className="text-xs">
                Enter trainer&apos;s legal first name
              </FormDescription>
              <FormMessage id="first-name-error" />
            </FormItem>
          )}
        />
        <FormField
          key="step1-last-name"
          control={form.control}
          name="last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  id="last_name"
                  placeholder="e.g., Smith"
                  className="h-12"
                  aria-describedby="last-name-error last-name-help"
                  value={field.value || ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              </FormControl>
              <FormDescription id="last-name-help" className="text-xs">
                Enter trainer&apos;s legal last name
              </FormDescription>
              <FormMessage id="last-name-error" />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
        <FormField
          control={form.control}
          name="date_of_birth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date of Birth *</FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value ? new Date(field.value) : undefined}
                  onChange={(date) => {
                    field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                  }}
                  placeholder="Select date of birth"
                  format="PPP"
                  className="h-12"
                  showYearMonthPickers={true}
                  yearRange={{
                    from: 1930,
                    to: new Date().getFullYear() - 18,
                  }}
                />
              </FormControl>
              <FormDescription className="text-xs">
                Trainer must be at least 18 years old
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          key="step1-email"
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  id="email"
                  type="email"
                  placeholder="john.trainer@example.com"
                  className="h-12"
                  aria-describedby="email-error email-help"
                  value={field.value || ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              </FormControl>
              <FormDescription id="email-help" className="text-xs">
                Professional email for client communications
              </FormDescription>
              <FormMessage id="email-error" />
            </FormItem>
          )}
        />
      </div>

      <FormField
        key="step1-phone"
        control={form.control}
        name="phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Phone Number</FormLabel>
            <FormControl>
              <Input
                {...field}
                id="phone"
                placeholder="+1 (555) 123-4567"
                className="h-12"
                aria-describedby="phone-error phone-help"
                value={field.value || ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            </FormControl>
            <FormDescription id="phone-help" className="text-xs">
              Optional - for urgent communications and client contact
            </FormDescription>
            <FormMessage id="phone-error" />
          </FormItem>
        )}
      />
    </div>
  );
});
