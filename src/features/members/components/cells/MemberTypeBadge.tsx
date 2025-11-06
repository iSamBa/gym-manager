import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { UserCheck, UserPlus, Handshake } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MemberType } from "@/features/database/lib/types";

interface MemberTypeBadgeProps {
  /** Member type */
  type: MemberType;
  /** Badge size */
  size?: "sm" | "md";
  /** Show icon */
  showIcon?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Displays member type with distinct styling
 * Full: Blue, Trial: Purple, Collaboration: Orange
 */
export const MemberTypeBadge = memo(function MemberTypeBadge({
  type,
  size = "sm",
  showIcon = true,
  className,
}: MemberTypeBadgeProps) {
  const getTypeConfig = () => {
    switch (type) {
      case "full":
        return {
          Icon: UserCheck,
          label: "Full",
          colorClass: "bg-blue-100 text-blue-700 border-blue-200",
        };
      case "trial":
        return {
          Icon: UserPlus,
          label: "Trial",
          colorClass: "bg-purple-100 text-purple-700 border-purple-200",
        };
      case "collaboration":
        return {
          Icon: Handshake,
          label: "Collaboration",
          colorClass: "bg-orange-100 text-orange-700 border-orange-200",
        };
      default:
        return {
          Icon: UserCheck,
          label: "Unknown",
          colorClass: "bg-gray-100 text-gray-700 border-gray-200",
        };
    }
  };

  const { Icon, label, colorClass } = getTypeConfig();

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
