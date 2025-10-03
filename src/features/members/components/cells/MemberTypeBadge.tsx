import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { UserCheck, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MemberTypeBadgeProps {
  /** Member type */
  type: "full" | "trial";
  /** Badge size */
  size?: "sm" | "md";
  /** Show icon */
  showIcon?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Displays member type with distinct styling
 * Full: Blue, Trial: Purple
 */
export const MemberTypeBadge = memo(function MemberTypeBadge({
  type,
  size = "sm",
  showIcon = true,
  className,
}: MemberTypeBadgeProps) {
  const isFull = type === "full";
  const Icon = isFull ? UserCheck : UserPlus;
  const label = isFull ? "Full" : "Trial";
  const colorClass = isFull
    ? "bg-blue-100 text-blue-700 border-blue-200"
    : "bg-purple-100 text-purple-700 border-purple-200";

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1",
        colorClass,
        size === "sm" && "py-0.5 text-xs",
        className
      )}
    >
      {showIcon && (
        <Icon className={cn(size === "sm" ? "h-3 w-3" : "h-4 w-4")} />
      )}
      <span>{label}</span>
    </Badge>
  );
});
