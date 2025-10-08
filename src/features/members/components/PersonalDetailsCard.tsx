"use client";

import { memo, useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Edit } from "lucide-react";
import { toast } from "sonner";
import type { Member } from "@/features/database/lib/types";
import { useUpdateMember } from "@/features/members/hooks";
import { PersonalDetailsEditor } from "./PersonalDetailsEditor";

interface PersonalDetailsCardProps {
  member: Member;
}

export const PersonalDetailsCard = memo(function PersonalDetailsCard({
  member,
}: PersonalDetailsCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Member>(member);
  const updateMember = useUpdateMember();

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

  const handleSave = useCallback(async () => {
    try {
      await updateMember.mutateAsync({
        id: member.id,
        data: {
          date_of_birth: formData.date_of_birth,
          gender: formData.gender,
          medical_conditions: formData.medical_conditions,
        },
      });
      setIsEditing(false);
      toast.success("Personal details updated successfully");
    } catch (error) {
      toast.error("Failed to update personal details");
    }
  }, [formData, member.id, updateMember]);

  const handleCancel = useCallback(() => {
    setFormData(member);
    setIsEditing(false);
  }, [member]);

  const handleFormChange = useCallback((updated: Partial<Member>) => {
    setFormData((prev) => ({ ...prev, ...updated }));
  }, []);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="h-4 w-4" />
          Personal Details
        </CardTitle>
        {!isEditing && (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <>
            <PersonalDetailsEditor
              member={formData}
              onChange={handleFormChange}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateMember.isPending}>
                {updateMember.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </>
        ) : (
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
              <div className="space-y-2 md:col-span-2">
                <span className="text-muted-foreground">
                  Medical Conditions
                </span>
                <div className="flex flex-wrap gap-2">
                  {member.medical_conditions
                    .split("\n")
                    .filter((condition) => condition.trim())
                    .map((condition, index) => (
                      <Badge key={index} variant="secondary">
                        {condition.trim()}
                      </Badge>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
