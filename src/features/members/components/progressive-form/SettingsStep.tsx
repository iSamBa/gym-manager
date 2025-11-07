import { memo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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

export const SettingsStep = memo(function SettingsStep({
  form,
}: FormStepProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Member Status *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="active">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    Active
                  </div>
                </SelectItem>
                <SelectItem value="inactive">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-gray-500"></div>
                    Inactive
                  </div>
                </SelectItem>
                <SelectItem value="suspended">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                    Suspended
                  </div>
                </SelectItem>
                <SelectItem value="expired">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    Expired
                  </div>
                </SelectItem>
                <SelectItem value="pending">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                    Pending
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Internal Notes</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Add any internal staff notes..."
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

      <div className="space-y-4 rounded-lg border p-4">
        <h4 className="font-medium">Member Agreements</h4>

        <FormField
          control={form.control}
          name="waiver_signed"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-y-0 space-x-3">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-describedby="waiver-description"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="font-medium">
                  Liability Waiver Signed *
                </FormLabel>
                <FormDescription id="waiver-description">
                  Member has signed the required liability waiver
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="marketing_consent"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-y-0 space-x-3">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-describedby="marketing-description"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="font-medium">
                  Marketing Communications
                </FormLabel>
                <FormDescription id="marketing-description">
                  Member consents to receive promotional emails and updates
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
});
