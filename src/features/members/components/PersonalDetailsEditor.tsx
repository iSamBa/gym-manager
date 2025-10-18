"use client";

import React, { useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import type { Member, Gender } from "@/features/database/lib/types";
import { formatForDatabase } from "@/lib/date-utils";

interface PersonalDetailsEditorProps {
  member: Member;
  onChange: (updated: Partial<Member>) => void;
  className?: string;
}

export function PersonalDetailsEditor({
  member,
  onChange,
  className,
}: PersonalDetailsEditorProps) {
  const handleFieldChange = useCallback(
    (field: keyof Member, value: unknown) => {
      onChange({ [field]: value });
    },
    [onChange]
  );

  const handleDateChange = useCallback(
    (date: Date | undefined) => {
      // Convert Date to local date string for database
      onChange({
        date_of_birth: date ? formatForDatabase(date) : undefined,
      });
    },
    [onChange]
  );

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
        {/* Date of Birth */}
        <div className="space-y-2">
          <Label htmlFor="date_of_birth" className="text-sm">
            Date of Birth
          </Label>
          <DatePicker
            value={
              member.date_of_birth ? new Date(member.date_of_birth) : undefined
            }
            onChange={handleDateChange}
            placeholder="Select date of birth"
            format="PP"
            yearRange={{ from: 1900, to: new Date().getFullYear() }}
            showYearMonthPickers={true}
            className="h-9"
          />
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <Label htmlFor="gender" className="text-sm">
            Gender
          </Label>
          <Select
            value={member.gender || ""}
            onValueChange={(value) =>
              handleFieldChange("gender", value as Gender)
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Join Date (Read-only) */}
        <div className="space-y-2">
          <Label className="text-muted-foreground text-sm">Join Date</Label>
          <div className="border-input bg-muted flex h-9 items-center rounded-md border px-3 py-2 text-sm">
            {formatDate(new Date(member.join_date))}
          </div>
        </div>

        {/* Account Created (Read-only) */}
        <div className="space-y-2">
          <Label className="text-muted-foreground text-sm">
            Account Created
          </Label>
          <div className="border-input bg-muted flex h-9 items-center rounded-md border px-3 py-2 text-sm">
            {formatDate(new Date(member.created_at))}
          </div>
        </div>

        {/* Medical Conditions */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="medical_conditions" className="text-sm">
            Medical Conditions
          </Label>
          <Textarea
            id="medical_conditions"
            value={member.medical_conditions || ""}
            onChange={(e) =>
              handleFieldChange("medical_conditions", e.target.value)
            }
            placeholder="Enter any medical conditions or notes..."
            className="min-h-[80px] resize-none"
          />
        </div>
      </div>
    </div>
  );
}
