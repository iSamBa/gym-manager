import { memo } from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
                Enter your legal first name
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
                Enter your legal last name
              </FormDescription>
              <FormMessage id="last-name-error" />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    to: new Date().getFullYear() - 13,
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
});
