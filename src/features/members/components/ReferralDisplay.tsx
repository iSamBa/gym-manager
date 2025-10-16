"use client";

import { memo, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { Member, ReferralSource } from "@/features/database/lib/types";
import { useMembers } from "@/features/members/hooks";

interface ReferralDisplayProps {
  member: Member;
  className?: string;
}

const formatReferralSource = (source: ReferralSource): string => {
  const mapping: Record<ReferralSource, string> = {
    instagram: "Instagram",
    member_referral: "Member Referral",
    website_ib: "Website (Inbound)",
    prospection: "Prospection (Outbound)",
    studio: "Studio (Walk-in)",
    phone: "Phone",
    chatbot: "Chatbot",
  };
  return mapping[source];
};

export const ReferralDisplay = memo(function ReferralDisplay({
  member,
  className,
}: ReferralDisplayProps) {
  // Fetch members to get the referred member's name
  const { data: allMembers = [] } = useMembers({ limit: 10000 });

  // Find the referred member
  const referredByMember = useMemo(
    () => allMembers.find((m) => m.id === member.referred_by_member_id),
    [allMembers, member.referred_by_member_id]
  );

  return (
    <>
      {/* Referral Source */}
      <div className={cn("space-y-1", className)}>
        <span className="text-muted-foreground">Referral Source</span>
        <div>
          <Badge variant="outline">
            {formatReferralSource(member.referral_source)}
          </Badge>
        </div>
      </div>

      {/* Referred By Member */}
      {member.referred_by_member_id && (
        <div className="space-y-1">
          <span className="text-muted-foreground">Referred By</span>
          <div>
            <Button variant="link" className="h-auto p-0" asChild>
              <Link href={`/members/${member.referred_by_member_id}`}>
                {referredByMember
                  ? `${referredByMember.first_name} ${referredByMember.last_name}`
                  : "View Member"}
              </Link>
            </Button>
          </div>
        </div>
      )}
    </>
  );
});
