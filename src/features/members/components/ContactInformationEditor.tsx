"use client";

import React, { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Member } from "@/features/database/lib/types";

interface ContactInformationEditorProps {
  member: Member;
  onChange: (updated: Partial<Member>) => void;
  className?: string;
}

export function ContactInformationEditor({
  member,
  onChange,
  className,
}: ContactInformationEditorProps) {
  const handleFieldChange = useCallback(
    (field: keyof Member, value: unknown) => {
      onChange({ [field]: value });
    },
    [onChange]
  );

  const handleAddressChange = useCallback(
    (field: string, value: string) => {
      const updatedAddress = {
        ...member.address,
        [field]: value,
      };
      onChange({ address: updatedAddress });
    },
    [member.address, onChange]
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={member.email || ""}
          onChange={(e) => handleFieldChange("email", e.target.value)}
          className="h-9"
        />
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone" className="text-sm">
          Phone
        </Label>
        <Input
          id="phone"
          type="tel"
          value={member.phone || ""}
          onChange={(e) => handleFieldChange("phone", e.target.value)}
          className="h-9"
        />
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label className="text-sm">Address</Label>

        <Input
          placeholder="Street"
          value={member.address?.street || ""}
          onChange={(e) => handleAddressChange("street", e.target.value)}
          className="h-9"
        />

        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="City"
            value={member.address?.city || ""}
            onChange={(e) => handleAddressChange("city", e.target.value)}
            className="h-9"
          />
          <Input
            placeholder="State"
            value={member.address?.state || ""}
            onChange={(e) => handleAddressChange("state", e.target.value)}
            className="h-9"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Postal Code"
            value={member.address?.postal_code || ""}
            onChange={(e) => handleAddressChange("postal_code", e.target.value)}
            className="h-9"
          />
          <Input
            placeholder="Country"
            value={member.address?.country || ""}
            onChange={(e) => handleAddressChange("country", e.target.value)}
            className="h-9"
          />
        </div>
      </div>
    </div>
  );
}
