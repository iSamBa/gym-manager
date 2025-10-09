"use client";

import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Member, VestSize } from "@/features/database/lib/types";

interface EquipmentDisplayProps {
  member: Member;
  className?: string;
}

const formatVestSize = (size: VestSize): string => {
  const mapping: Record<VestSize, string> = {
    V1: "V1",
    V2: "V2",
    V2_SMALL_EXT: "V2 with Small Extension",
    V2_LARGE_EXT: "V2 with Large Extension",
    V2_DOUBLE_EXT: "V2 with Double Extension",
  };
  return mapping[size];
};

export const EquipmentDisplay = memo(function EquipmentDisplay({
  member,
  className,
}: EquipmentDisplayProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-4", className)}>
      <div className="space-y-1">
        <span className="text-muted-foreground text-sm">Uniform Size</span>
        <div>
          <Badge variant="outline">{member.uniform_size}</Badge>
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-muted-foreground text-sm">Uniform Status</span>
        <div>
          <Badge
            className={cn(
              "border",
              member.uniform_received
                ? "border-green-200 bg-green-100 text-green-800"
                : "border-amber-200 bg-amber-100 text-amber-800"
            )}
          >
            {member.uniform_received ? "✓ Received" : "⚠ Not Received"}
          </Badge>
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-muted-foreground text-sm">Vest Size</span>
        <div>
          <Badge variant="outline">{formatVestSize(member.vest_size)}</Badge>
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-muted-foreground text-sm">Hip Belt Size</span>
        <div>
          <Badge variant="outline">{member.hip_belt_size}</Badge>
        </div>
      </div>
    </div>
  );
});
