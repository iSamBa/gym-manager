import React from "react";
import { cn } from "@/lib/utils";
import type { TrainerWithProfile } from "@/features/database/lib/types";

interface TrainerAvatarProps {
  trainer: Pick<
    TrainerWithProfile,
    "id" | "user_profile" | "is_accepting_new_clients"
  >;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showStatus?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  xs: "h-6 w-6 text-xs",
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-xl",
} as const;

const statusDotSizes = {
  xs: "h-1.5 w-1.5",
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-4 w-4",
  xl: "h-6 w-6",
} as const;

export function TrainerAvatar({
  trainer,
  size = "md",
  showStatus = false,
  className,
  onClick,
}: TrainerAvatarProps) {
  // Handle missing user profile gracefully
  const firstName = trainer.user_profile?.first_name || "T";
  const lastName = trainer.user_profile?.last_name || "R";

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <div className="relative inline-block">
      <div
        className={cn(
          "bg-muted text-muted-foreground flex items-center justify-center rounded-full font-medium",
          sizeClasses[size],
          onClick && "cursor-pointer transition-opacity hover:opacity-80",
          className
        )}
        onClick={onClick}
      >
        {initials}
      </div>

      {showStatus && trainer.is_accepting_new_clients && (
        <div
          className={cn(
            "border-background absolute -right-0.5 -bottom-0.5 rounded-full border-2 bg-green-500",
            statusDotSizes[size]
          )}
          aria-label="Accepting new clients"
        />
      )}
    </div>
  );
}
