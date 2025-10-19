/**
 * Planning Parameter Edit
 * Editable row for a planning parameter (edit mode)
 */

"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface PlanningParameterEditProps {
  icon?: LucideIcon;
  iconColor?: string;
  label: string;
  description: string;
  value: number;
  unit?: string;
  min: number;
  max: number;
  onChange: (value: number) => void;
  error?: string | null;
}

export function PlanningParameterEdit({
  icon: Icon,
  iconColor,
  label,
  description,
  value,
  unit,
  min,
  max,
  onChange,
  error,
}: PlanningParameterEditProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || 0;
    onChange(newValue);
  };

  return (
    <div className="border-border flex items-center gap-4 border-b py-4 last:border-b-0">
      {/* Left: Icon + Label + Description */}
      <div className="flex flex-1 items-start gap-3">
        {Icon ? (
          <div className="mt-1">
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
        ) : (
          <div className="mt-1 h-5 w-5" />
        )}
        <div className="flex-1">
          <p className="font-medium">{label}</p>
          <p className="text-muted-foreground text-sm">{description}</p>
          {error && <p className="text-destructive mt-1 text-xs">{error}</p>}
        </div>
      </div>

      {/* Right: Editable Input */}
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={value}
          onChange={handleChange}
          className={cn("w-24 text-right", error && "border-destructive")}
          min={min}
          max={max}
        />
        {unit && (
          <span className="text-muted-foreground w-12 text-sm">{unit}</span>
        )}
      </div>
    </div>
  );
}
