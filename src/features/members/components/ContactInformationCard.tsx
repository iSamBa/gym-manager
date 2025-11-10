"use client";

import { memo, useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Copy, Check, Edit } from "lucide-react";
import { toast } from "sonner";
import type {
  Member,
  MemberWithSubscription,
} from "@/features/database/lib/types";
import { useUpdateMember } from "@/features/members/hooks";
import { ContactInformationEditor } from "./ContactInformationEditor";

interface ContactInformationCardProps {
  member: MemberWithSubscription;
}

export const ContactInformationCard = memo(function ContactInformationCard({
  member,
}: ContactInformationCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Member>(member);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const updateMember = useUpdateMember();

  const handleCopyEmail = useCallback(async () => {
    if (!member.email) return;
    await navigator.clipboard.writeText(member.email);
    setCopiedEmail(true);
    toast.success("Email copied to clipboard");
    setTimeout(() => setCopiedEmail(false), 2000);
  }, [member.email]);

  const handleCopyPhone = useCallback(async () => {
    if (!member.phone) return;
    await navigator.clipboard.writeText(member.phone);
    setCopiedPhone(true);
    toast.success("Phone copied to clipboard");
    setTimeout(() => setCopiedPhone(false), 2000);
  }, [member.phone]);

  const handleSave = useCallback(async () => {
    try {
      await updateMember.mutateAsync({
        id: member.id,
        data: {
          email: formData.email ?? undefined,
          phone: formData.phone,
          address: formData.address,
        },
      });
      setIsEditing(false);
      toast.success("Contact information updated successfully");
    } catch {
      toast.error("Failed to update contact information");
    }
  }, [formData, member.id, updateMember]);

  const handleCancel = useCallback(() => {
    setFormData(member);
    setIsEditing(false);
  }, [member]);

  const handleFormChange = useCallback((updated: Partial<Member>) => {
    setFormData((prev) => ({ ...prev, ...updated }));
  }, []);

  const formatAddress = useCallback((address: Member["address"]) => {
    if (!address) return "No address provided";
    return `${address.street}, ${address.city}, ${address.state} ${address.postal_code}, ${address.country}`;
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4" />
          Contact Information
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
            <ContactInformationEditor
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
          <div className="space-y-4">
            {/* Email */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="text-muted-foreground h-4 w-4" />
                <span className="text-sm">{member.email}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyEmail}
                className="h-8 w-8 p-0"
              >
                {copiedEmail ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Phone */}
            {member.phone && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="text-muted-foreground h-4 w-4" />
                  <span className="text-sm">{member.phone}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyPhone}
                  className="h-8 w-8 p-0"
                >
                  {copiedPhone ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}

            {/* Address */}
            <div className="flex items-start gap-2">
              <MapPin className="text-muted-foreground mt-0.5 h-4 w-4" />
              <span className="text-sm">{formatAddress(member.address)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
