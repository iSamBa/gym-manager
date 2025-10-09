"use client";

import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Member, TrainingPreference } from "@/features/database/lib/types";

interface TrainingPreferenceDisplayProps {
  member: Member;
  className?: string;
}

const formatTrainingPreference = (pref?: TrainingPreference): string => {
  if (!pref) return "Not Specified";
  return pref === "mixed" ? "Mixed Sessions" : "Women Only Sessions";
};

export const TrainingPreferenceDisplay = memo(
  function TrainingPreferenceDisplay({
    member,
    className,
  }: TrainingPreferenceDisplayProps) {
    if (member.gender !== "female") return null;

    return (
      <div className={cn("space-y-1", className)}>
        <span className="text-muted-foreground text-sm">
          Session Preference
        </span>
        <div>
          <Badge variant={member.training_preference ? "default" : "secondary"}>
            {formatTrainingPreference(member.training_preference)}
          </Badge>
        </div>
      </div>
    );
  }
);
