import { memo, useMemo } from "react";
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
import { useMembers } from "@/features/members/hooks";
import type { FormStepProps } from "./types";

export const ReferralStep = memo(function ReferralStep({
  form,
  member,
}: FormStepProps) {
  const referralSource = form.watch("referral_source");
  const { data: membersData } = useMembers({
    limit: 1000,
  });

  const availableMembers = useMemo(() => {
    const members = membersData || [];
    if (!member?.id) return members;
    return members.filter((m) => m.id !== member.id);
  }, [membersData, member?.id]);

  const showReferredBy = referralSource === "member_referral";

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="referral_source"
        render={({ field }) => (
          <FormItem>
            <FormLabel>How did you hear about us? *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select referral source" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="member_referral">Member Referral</SelectItem>
                <SelectItem value="website_ib">Website (Inbound)</SelectItem>
                <SelectItem value="prospection">
                  Prospection (Outbound)
                </SelectItem>
                <SelectItem value="studio">Studio (Walk-in)</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="chatbot">Chatbot</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {showReferredBy && (
        <FormField
          control={form.control}
          name="referred_by_member_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Referred By Member *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableMembers.length === 0 ? (
                    <SelectItem value="no-members" disabled>
                      No members available
                    </SelectItem>
                  ) : (
                    availableMembers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.first_name} {m.last_name} ({m.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormDescription>
                Select the member who referred this new member
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
});
