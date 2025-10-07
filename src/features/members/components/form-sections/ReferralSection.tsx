import React, { memo, useMemo } from "react";
import { Control, useWatch } from "react-hook-form";
import { UserPlus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMembers } from "@/features/members/hooks";

interface ReferralSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  excludeMemberId?: string; // For edit mode - exclude current member
}

export const ReferralSection = memo(function ReferralSection({
  control,
  excludeMemberId,
}: ReferralSectionProps) {
  // Watch referral_source to show/hide member selector
  const referralSource = useWatch({
    control,
    name: "referral_source",
  });

  // Fetch members for referral selector
  const { data: membersData } = useMembers({
    page: 1,
    limit: 1000, // Get all members for selector (optimize later if needed)
  });

  // Filter out current member to prevent self-referral
  const availableMembers = useMemo(() => {
    const members = membersData?.pages?.[0]?.data || [];
    if (!excludeMemberId) return members;
    return members.filter((m) => m.id !== excludeMemberId);
  }, [membersData, excludeMemberId]);

  const showReferredBy = referralSource === "member_referral";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserPlus className="h-5 w-5" />
          Referral Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Referral Source */}
          <FormField
            control={control}
            name="referral_source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>How did you hear about us? *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select referral source" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="member_referral">
                      Member Referral
                    </SelectItem>
                    <SelectItem value="website_ib">
                      Website (Inbound)
                    </SelectItem>
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

          {/* Referred By Member - Conditional */}
          {showReferredBy && (
            <FormField
              control={control}
              name="referred_by_member_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referred By Member *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableMembers.length === 0 ? (
                        <SelectItem value="no-members" disabled>
                          No members available
                        </SelectItem>
                      ) : (
                        availableMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.first_name} {member.last_name} (
                            {member.email})
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
      </CardContent>
    </Card>
  );
});
