/**
 * Planning Parameter Display
 * Read-only display row for a planning parameter
 */

"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface PlanningParameterDisplayProps {
  icon?: LucideIcon;
  iconColor?: string;
  label: string;
  description: string;
  value: number;
  unit?: string;
}

export function PlanningParameterDisplay({
  icon: Icon,
  iconColor,
  label,
  description,
  value,
  unit,
}: PlanningParameterDisplayProps) {
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
        </div>
      </div>

      {/* Right: Display Value */}
      <div className="flex items-center gap-2">
        <span className="w-24 text-right font-medium tabular-nums">
          {value}
        </span>
        {unit && (
          <span className="text-muted-foreground w-12 text-sm">{unit}</span>
        )}
      </div>
    </div>
  );
}
