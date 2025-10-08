"use client";

import { memo, useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MapPin, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import type { MemberWithSubscription } from "@/features/database/lib/types";

interface ContactInformationCardProps {
  member: MemberWithSubscription;
}

export const ContactInformationCard = memo(function ContactInformationCard({
  member,
}: ContactInformationCardProps) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const handleCopyEmail = useCallback(async () => {
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

  const formatAddress = useCallback((address: Member["address"]) => {
    if (!address) return "No address provided";
    return `${address.street}, ${address.city}, ${address.state} ${address.postal_code}, ${address.country}`;
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4" />
          Contact Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Member Contact Information */}
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

          {/* Emergency Contacts */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Emergency Contacts</h3>
            {!member.emergency_contacts ||
            member.emergency_contacts.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No emergency contacts on file
              </p>
            ) : (
              <div className="space-y-3">
                {member.emergency_contacts.map((contact, index) => (
                  <div
                    key={index}
                    className="border-border bg-muted/50 rounded-lg border p-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          {contact.first_name} {contact.last_name}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          {contact.relationship}
                        </Badge>
                      </div>
                      <p className="text-sm font-semibold">{contact.phone}</p>
                      {contact.email && (
                        <p className="text-muted-foreground text-xs">
                          {contact.email}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
