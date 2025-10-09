"use client";

import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { Member, ReferralSource } from "@/features/database/lib/types";

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
  return (
    <div className={cn("grid grid-cols-2 gap-4", className)}>
      <div className="space-y-1">
        <span className="text-muted-foreground text-sm">Referral Source</span>
        <div>
          <Badge variant="outline">
            {formatReferralSource(member.referral_source)}
          </Badge>
        </div>
      </div>

      {member.referred_by_member_id && (
        <div className="space-y-1">
          <span className="text-muted-foreground text-sm">Referred By</span>
          <div>
            <Button variant="link" className="h-auto p-0 text-sm" asChild>
              <Link href={`/members/${member.referred_by_member_id}`}>
                View Member
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});
