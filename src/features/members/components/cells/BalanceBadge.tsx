import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface BalanceBadgeProps {
  /** Balance amount */
  amount: number;
  /** Currency symbol */
  currency?: string;
  /** Show tooltip */
  showTooltip?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Displays balance with color coding
 * Green: $0.00 (paid), Red: >$0.00 (outstanding)
 */
export const BalanceBadge = memo(function BalanceBadge({
  amount,
  currency = "$",
  showTooltip = true,
  className,
}: BalanceBadgeProps) {
  const isPaid = amount <= 0;
  const variant = isPaid ? "default" : "destructive";
  const colorClass = isPaid ? "bg-green-100 text-green-700" : "";

  const formattedAmount = `${currency}${Math.abs(amount).toFixed(2)}`;

  const badge = (
    <Badge variant={variant} className={cn("gap-1", colorClass, className)}>
      <DollarSign className="h-3 w-3" />
      <span>{formattedAmount}</span>
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
          <p>
            {isPaid ? "Fully paid" : `Outstanding balance: ${formattedAmount}`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
