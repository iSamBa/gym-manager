import { memo } from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateCellProps {
  /** ISO date string or null */
  date: string | null;
  /** Optional custom format */
  format?: "short" | "long" | "relative";
  /** Show icon */
  showIcon?: boolean;
  /** Custom empty text */
  emptyText?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Displays formatted date with consistent styling
 * Handles null values gracefully
 */
export const DateCell = memo(function DateCell({
  date,
  format = "short",
  showIcon = false,
  emptyText = "-",
  className,
}: DateCellProps) {
  if (!date) {
    return (
      <span className={cn("text-muted-foreground text-sm", className)}>
        {emptyText}
      </span>
    );
  }

  const formattedDate = formatDate(date, format);

  return (
    <div className={cn("flex items-center gap-1.5 text-sm", className)}>
      {showIcon && <Calendar className="text-muted-foreground h-3.5 w-3.5" />}
      <span>{formattedDate}</span>
    </div>
  );
});

function formatDate(
  dateString: string,
  format: "short" | "long" | "relative"
): string {
  const date = new Date(dateString);

  switch (format) {
    case "short":
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    case "long":
      return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    case "relative":
      return getRelativeTimeString(date);
    default:
      return date.toLocaleDateString();
  }
}

function getRelativeTimeString(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;

  return formatDate(date.toISOString(), "short");
}
