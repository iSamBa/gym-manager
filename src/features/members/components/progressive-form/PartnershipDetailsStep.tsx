import { memo } from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

export const PartnershipDetailsStep = memo(function PartnershipDetailsStep({
  form,
}: FormStepProps) {
  const memberType = form.watch("member_type");

  if (memberType !== "collaboration") {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-950">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Partnership details are only required for collaboration members.
          Please select &quot;Collaboration Partner&quot; as the member type if
          this applies.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="partnership_company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Partnership Company *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g., Nike, Gymshark, etc."
                  className="h-12"
                />
              </FormControl>
              <FormDescription className="text-xs">
                Name of the partner company or organization
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="partnership_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Partnership Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select type (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="influencer">Influencer</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="brand">Brand</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="partnership_contract_start"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contract Start Date</FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value ? new Date(field.value) : undefined}
                  onChange={(date) => {
                    field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                  }}
                  placeholder="Select start date"
                  format="PPP"
                  className="h-12"
                />
              </FormControl>
              <FormDescription className="text-xs">
                Optional - when the partnership contract begins
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="partnership_contract_end"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contract End Date *</FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value ? new Date(field.value) : undefined}
                  onChange={(date) => {
                    field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                  }}
                  placeholder="Select end date"
                  format="PPP"
                  className="h-12"
                />
              </FormControl>
              <FormDescription className="text-xs">
                Required - must be a future date
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
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
                placeholder="Contract terms, deliverables, special conditions..."
                className="min-h-[100px] resize-none"
                {...field}
              />
            </FormControl>
            <FormDescription>
              Additional details about the partnership agreement
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
});
