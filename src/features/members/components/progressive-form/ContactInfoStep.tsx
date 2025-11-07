import { memo } from "react";
import { Input } from "@/components/ui/input";
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

export const ContactInfoStep = memo(function ContactInfoStep({
  form,
}: FormStepProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
        <FormField
          key="step2-email"
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
                  placeholder="john.doe@example.com"
                  className="h-12"
                  aria-describedby="email-error email-help"
                  value={field.value || ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              </FormControl>
              <FormDescription id="email-help" className="text-xs">
                We&apos;ll use this to send important updates about your
                membership
              </FormDescription>
              <FormMessage id="email-error" />
            </FormItem>
          )}
        />
        <FormField
          key="step2-phone"
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
                Optional - we&apos;ll use this for urgent communications only
              </FormDescription>
              <FormMessage id="phone-error" />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="preferred_contact_method"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Preferred Contact Method *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select contact method" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="email">📧 Email</SelectItem>
                <SelectItem value="phone">📞 Phone Call</SelectItem>
                <SelectItem value="sms">💬 SMS/Text</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
});
