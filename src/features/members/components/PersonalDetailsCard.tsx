"use client";

import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";
import type { Member } from "@/features/database/lib/types";

interface PersonalDetailsCardProps {
  member: Member;
}

export const PersonalDetailsCard = memo(function PersonalDetailsCard({
  member,
}: PersonalDetailsCardProps) {
  const age = useMemo(() => {
    if (!member.date_of_birth) return null;
    const today = new Date();
    const birthDate = new Date(member.date_of_birth);
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      calculatedAge--;
    }

    return calculatedAge;
  }, [member.date_of_birth]);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="h-4 w-4" />
          Personal Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          {/* Date of Birth */}
          {member.date_of_birth && (
            <div className="space-y-1">
              <span className="text-muted-foreground">Date of Birth</span>
              <p className="font-medium">
                {formatDate(new Date(member.date_of_birth))}
                {age !== null && (
                  <span className="text-muted-foreground ml-1">
                    ({age} years old)
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Gender */}
          <div className="space-y-1">
            <span className="text-muted-foreground">Gender</span>
            <p className="font-medium capitalize">
              {member.gender || "Not specified"}
            </p>
          </div>

          {/* Join Date */}
          <div className="space-y-1">
            <span className="text-muted-foreground">Join Date</span>
            <p className="font-medium">
              {formatDate(new Date(member.join_date))}
            </p>
          </div>

          {/* Account Created */}
          <div className="space-y-1">
            <span className="text-muted-foreground">Account Created</span>
            <p className="font-medium">
              {formatDate(new Date(member.created_at))}
            </p>
          </div>

          {/* Medical Conditions */}
          {member.medical_conditions && (
            <div className="space-y-1 md:col-span-2">
              <span className="text-muted-foreground">Medical Conditions</span>
              <p className="text-sm">{member.medical_conditions}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
