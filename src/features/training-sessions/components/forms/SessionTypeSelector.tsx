import React, { memo } from "react";
import { cn } from "@/lib/utils";
import type { SessionType } from "@/features/database/lib/types";

interface SessionTypeOption {
  value: SessionType;
  label: string;
  description: string;
  colorClass: string;
}

const SESSION_TYPE_OPTIONS: SessionTypeOption[] = [
  {
    value: "trial",
    label: "TRIAL SESSION",
    description: "Try-out session for new members",
    colorClass: "bg-blue-500 hover:bg-blue-600 text-white border-blue-500",
  },
  {
    value: "member",
    label: "MEMBER SESSION",
    description: "Regular training session",
    colorClass: "bg-green-500 hover:bg-green-600 text-white border-green-500",
  },
  {
    value: "contractual",
    label: "CONTRACTUAL SESSION",
    description: "Contract signing after trial",
    colorClass:
      "bg-orange-500 hover:bg-orange-600 text-white border-orange-500",
  },
  {
    value: "multi_site",
    label: "MULTI-SITE SESSION",
    description: "Member from another gym",
    colorClass:
      "bg-purple-500 hover:bg-purple-600 text-white border-purple-500",
  },
  {
    value: "collaboration",
    label: "COLLABORATION SESSION",
    description: "Commercial partnership",
    colorClass: "bg-lime-600 hover:bg-lime-700 text-white border-lime-600",
  },
  {
    value: "makeup",
    label: "MAKE-UP SESSION",
    description: "Additional session (unlimited)",
    colorClass: "bg-blue-900 hover:bg-blue-950 text-white border-blue-900",
  },
  {
    value: "non_bookable",
    label: "NON-BOOKABLE SESSION",
    description: "Time blocker",
    colorClass: "bg-red-500 hover:bg-red-600 text-white border-red-500",
  },
];

interface SessionTypeSelectorProps {
  value: SessionType;
  onChange: (value: SessionType) => void;
}

export const SessionTypeSelector = memo<SessionTypeSelectorProps>(
  function SessionTypeSelector({ value, onChange }) {
    return (
      <div className="grid grid-cols-1 gap-3">
        {SESSION_TYPE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-lg border-2 p-4 text-left font-medium transition-all",
              value === option.value
                ? option.colorClass
                : "border-border hover:border-muted-foreground bg-background text-foreground"
            )}
          >
            <div className="text-sm font-bold tracking-wide">
              {option.label}
            </div>
            <p className="mt-1 text-xs opacity-90">{option.description}</p>
          </button>
        ))}
      </div>
    );
  }
);
