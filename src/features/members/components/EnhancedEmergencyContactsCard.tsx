"use client";

import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone } from "lucide-react";
import type { MemberWithSubscription } from "@/features/database/lib/types";

interface EnhancedEmergencyContactsCardProps {
  member: MemberWithSubscription;
}

export const EnhancedEmergencyContactsCard = memo(
  function EnhancedEmergencyContactsCard({
    member,
  }: EnhancedEmergencyContactsCardProps) {
    if (!member.emergency_contacts || member.emergency_contacts.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="h-4 w-4" />
              Emergency Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              No emergency contacts on file
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="h-4 w-4" />
            Emergency Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {member.emergency_contacts.map((contact, index) => (
              <div
                key={index}
                className="border-border bg-muted/50 rounded-lg border p-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-base font-medium">
                      {contact.first_name} {contact.last_name}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {contact.relationship}
                    </Badge>
                  </div>

                  <p className="text-lg font-semibold">{contact.phone}</p>

                  {contact.email && (
                    <p className="text-muted-foreground text-sm">
                      {contact.email}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
);
