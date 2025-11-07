import { memo } from "react";
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

export const MemberTypeStep = memo(function MemberTypeStep({
  form,
}: FormStepProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="member_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Member Type *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select member type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="full">Full Member</SelectItem>
                <SelectItem value="collaboration">
                  Collaboration Partner
                </SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              Trial members can try out sessions before committing. Full members
              have regular memberships. Collaboration partners are for
              commercial partnerships and influencers.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
});
