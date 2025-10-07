"use client";

import React, { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Member, TrainingPreference } from "@/features/database/lib/types";
import { useUpdateMember } from "@/features/members/hooks";
import { toast } from "sonner";

interface TrainingPreferenceEditorProps {
  member: Member;
  className?: string;
}

// Format training preference for display
const formatTrainingPreference = (pref?: TrainingPreference): string => {
  if (!pref) return "Not Specified";
  return pref === "mixed" ? "Mixed Sessions" : "Women Only Sessions";
};

export function TrainingPreferenceEditor({
  member,
  className,
}: TrainingPreferenceEditorProps) {
  const updateMemberMutation = useUpdateMember();

  const handleUpdate = useCallback(
    async (value: string) => {
      try {
        await updateMemberMutation.mutateAsync({
          id: member.id,
          data: {
            training_preference:
              value === "not_specified"
                ? undefined
                : (value as TrainingPreference),
          },
        });

        toast.success("Updated", {
          description: "Member training preference has been updated.",
        });
      } catch (error) {
        toast.error("Update Failed", {
          description:
            error instanceof Error
              ? error.message
              : "Failed to update training preference. Please try again.",
        });
      }
    },
    [member.id, updateMemberMutation]
  );

  // Safety check - if member is not defined, don't render
  if (!member) {
    return null;
  }

  // Ensure we always have a valid string value for the select
  const selectValue = member.training_preference
    ? String(member.training_preference)
    : "not_specified";

  return (
    <div
      className={cn("grid grid-cols-1 gap-3 text-sm md:grid-cols-2", className)}
    >
      {/* Session Preference */}
      <div>
        <span className="text-muted-foreground">Session Preference:</span>
        <Select value={selectValue} onValueChange={handleUpdate}>
          <SelectTrigger className="mt-1 h-8">
            <SelectValue placeholder="Not Specified" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mixed">Mixed Sessions</SelectItem>
            <SelectItem value="women_only">Women Only Sessions</SelectItem>
            <SelectItem value="not_specified">Not Specified</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
