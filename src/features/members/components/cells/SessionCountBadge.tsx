import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionCountBadgeProps {
  /** Number of sessions */
  count: number;
  /** Optional label */
  label?: string;
  /** Show tooltip */
  showTooltip?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Color variant - green (default) or yellow */
  colorVariant?: "green" | "yellow";
}

/**
 * Displays session count with color coding
 * Green: >5, Yellow: 1-5, Red/Gray: 0
 */
export const SessionCountBadge = memo(function SessionCountBadge({
  count,
  label,
  showTooltip = true,
  className,
  colorVariant = "green",
}: SessionCountBadgeProps) {
  const variant = getVariant(count);
  const colorClass = getColorClass(count, colorVariant);

  const badge = (
    <Badge variant={variant} className={cn("gap-1", colorClass, className)}>
      <Calendar className="h-3 w-3" />
      <span>{count}</span>
      {label && <span className="ml-1 text-xs">{label}</span>}
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText(count)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

function getVariant(count: number): "default" | "secondary" | "outline" {
  if (count === 0) return "secondary";
  return "default";
}

function getColorClass(
  count: number,
  colorVariant: "green" | "yellow"
): string {
  if (count === 0) return "bg-gray-100 text-gray-600";
  if (colorVariant === "yellow") return "bg-yellow-100 text-yellow-700";
  return "bg-green-100 text-green-700";
}

function getTooltipText(count: number): string {
  if (count === 0) return "No sessions scheduled";
  if (count === 1) return "1 session scheduled";
  return `${count} sessions scheduled`;
}
