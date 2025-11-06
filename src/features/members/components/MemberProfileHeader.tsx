"use client";

import { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MemberAvatar,
  MemberStatusBadge,
  AddSessionButton,
  AddPaymentButton,
} from "@/features/members/components";
import { Edit, Trash2, UserCog } from "lucide-react";
import type { Member } from "@/features/database/lib/types";

interface MemberProfileHeaderProps {
  member: Member;
  onEdit: () => void;
  onDelete: () => void;
  onSessionSuccess?: () => void;
  onPaymentSuccess?: () => void;
  onConvert?: () => void;
}

export const MemberProfileHeader = memo(function MemberProfileHeader({
  member,
  onEdit,
  onDelete,
  onSessionSuccess,
  onPaymentSuccess,
  onConvert,
}: MemberProfileHeaderProps) {
  const formatDate = useCallback((date: Date): string => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      {/* Left: Avatar + Info */}
      <div className="flex items-center gap-4">
        <MemberAvatar member={member} size="xl" />

        <div className="space-y-1">
          <h1 className="text-2xl font-bold">
            {member.first_name} {member.last_name}
          </h1>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              ID: {member.id.slice(-8)}
            </Badge>
            <span className="text-muted-foreground text-sm">
              Member since {formatDate(new Date(member.join_date))}
            </span>
          </div>

          <MemberStatusBadge
            status={member.status}
            memberId={member.id}
            readonly={false}
          />
        </div>
      </div>

      {/* Right: Quick Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <AddSessionButton
          member={member}
          variant="outline"
          size="default"
          showText
          onSuccess={onSessionSuccess}
        />
        <AddPaymentButton
          member={member}
          variant="outline"
          size="default"
          showText
          onSuccess={onPaymentSuccess}
        />
        {member.member_type === "collaboration" && onConvert && (
          <Button variant="outline" onClick={onConvert}>
            <UserCog className="mr-2 h-4 w-4" />
            Convert to Full
          </Button>
        )}
        <Button variant="outline" onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Profile
        </Button>
        <Button variant="destructive" onClick={onDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  );
});
