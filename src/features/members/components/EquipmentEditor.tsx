"use client";

import React, { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type {
  Member,
  UniformSize,
  VestSize,
  HipBeltSize,
} from "@/features/database/lib/types";

interface EquipmentEditorProps {
  member: Member;
  onChange: (updated: Partial<Member>) => void;
  className?: string;
}

// Format vest size for display
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

export function EquipmentEditor({
  member,
  onChange,
  className,
}: EquipmentEditorProps) {
  const handleFieldChange = useCallback(
    (field: keyof Member, value: unknown) => {
      onChange({ [field]: value });
    },
    [onChange]
  );

  // Safety check - if member is not defined, don't render
  if (!member) {
    return null;
  }

  return (
    <div
      className={cn("grid grid-cols-1 gap-3 text-sm md:grid-cols-2", className)}
    >
      {/* Uniform Size */}
      <div>
        <span className="text-muted-foreground">Uniform Size:</span>
        <Select
          value={member.uniform_size}
          onValueChange={(value) =>
            handleFieldChange("uniform_size", value as UniformSize)
          }
        >
          <SelectTrigger className="mt-1 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="XS">XS</SelectItem>
            <SelectItem value="S">S</SelectItem>
            <SelectItem value="M">M</SelectItem>
            <SelectItem value="L">L</SelectItem>
            <SelectItem value="XL">XL</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Uniform Received */}
      <div>
        <span className="text-muted-foreground">Uniform Status:</span>
        <div className="mt-1 flex items-center space-x-2">
          <Switch
            id="uniform-received"
            checked={member.uniform_received}
            onCheckedChange={(value) =>
              handleFieldChange("uniform_received", value)
            }
          />
          <Label
            htmlFor="uniform-received"
            className="cursor-pointer text-sm font-normal"
          >
            {member.uniform_received ? "Received" : "Not Received"}
          </Label>
        </div>
      </div>

      {/* Vest Size */}
      <div>
        <span className="text-muted-foreground">Vest Size:</span>
        <Select
          value={member.vest_size}
          onValueChange={(value) =>
            handleFieldChange("vest_size", value as VestSize)
          }
        >
          <SelectTrigger className="mt-1 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="V1">V1</SelectItem>
            <SelectItem value="V2">V2</SelectItem>
            <SelectItem value="V2_SMALL_EXT">
              V2 with Small Extension
            </SelectItem>
            <SelectItem value="V2_LARGE_EXT">
              V2 with Large Extension
            </SelectItem>
            <SelectItem value="V2_DOUBLE_EXT">
              V2 with Double Extension
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Hip Belt Size */}
      <div>
        <span className="text-muted-foreground">Hip Belt Size:</span>
        <Select
          value={member.hip_belt_size}
          onValueChange={(value) =>
            handleFieldChange("hip_belt_size", value as HipBeltSize)
          }
        >
          <SelectTrigger className="mt-1 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="V1">V1</SelectItem>
            <SelectItem value="V2">V2</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
