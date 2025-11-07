import { memo, useCallback } from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { MemberAvatar } from "../MemberAvatar";
import { MemberStatusBadge } from "../MemberStatusBadge";
import { DateCell, SessionCountBadge, MemberTypeBadge } from "../cells";
import { AddSessionButton } from "../AddSessionButton";
import { AddPaymentButton } from "../AddPaymentButton";
import type { MemberWithEnhancedDetails } from "@/features/database/lib/types";
import type { ColumnVisibility } from "../ColumnVisibilityToggle";

interface BalanceStyles {
  backgroundColor: string;
  textColor: string;
}

function getBalanceStyles(balance: number): BalanceStyles {
  if (balance > 0) {
    return {
      backgroundColor: "bg-red-50",
      textColor: "text-red-700",
    };
  } else if (balance < 0) {
    return {
      backgroundColor: "bg-green-50",
      textColor: "text-green-700",
    };
  } else {
    return {
      backgroundColor: "bg-gray-50",
      textColor: "text-gray-600",
    };
  }
}

function formatBalance(balance: number): string {
  const absBalance = Math.abs(balance);
  const formatted = absBalance.toFixed(2);

  if (balance < 0) {
    return `-$${formatted}`;
  }
  return `$${formatted}`;
}

interface MemberTableRowProps {
  member: MemberWithEnhancedDetails;
  isSelected: boolean;
  onSelect: (memberId: string, checked: boolean) => void;
  onClick?: (member: MemberWithEnhancedDetails) => void;
  onHover?: (member: MemberWithEnhancedDetails) => void;
  onRefresh?: () => void;
  showActions: boolean;
  columnVisibility: ColumnVisibility;
}

export const MemberTableRow = memo(function MemberTableRow({
  member,
  isSelected,
  onSelect,
  onClick,
  onHover,
  onRefresh,
  showActions,
  columnVisibility,
}: MemberTableRowProps) {
  const handleRowClick = useCallback(() => {
    onClick?.(member);
  }, [onClick, member]);

  const handleRowHover = useCallback(() => {
    onHover?.(member);
  }, [onHover, member]);

  const handleSelectChange = useCallback(
    (checked: boolean) => {
      onSelect(member.id, checked);
    },
    [onSelect, member.id]
  );

  const handleCheckboxClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleStatusClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleActionsClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const balance = member.active_subscription?.balance_due || 0;
  const balanceStyles = getBalanceStyles(balance);

  return (
    <TableRow
      className="hover:bg-muted/50 cursor-pointer"
      onClick={handleRowClick}
      onMouseEnter={handleRowHover}
    >
      {showActions && (
        <TableCell onClick={handleCheckboxClick}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleSelectChange}
            aria-label={`Select ${member.first_name} ${member.last_name}`}
          />
        </TableCell>
      )}

      {/* Member Name & Avatar */}
      <TableCell>
        <div className="flex items-center space-x-3">
          <MemberAvatar member={member} size="sm" />
          <span className="font-medium">
            {member.first_name} {member.last_name}
          </span>
        </div>
      </TableCell>

      {/* Phone */}
      <TableCell>
        <div className="text-muted-foreground text-sm">
          {member.phone || "-"}
        </div>
      </TableCell>

      {/* Gender */}
      {columnVisibility.gender && (
        <TableCell className="hidden xl:table-cell">
          <span className="text-sm capitalize">{member.gender || "-"}</span>
        </TableCell>
      )}

      {/* Date of Birth */}
      {columnVisibility.dateOfBirth && (
        <TableCell className="hidden xl:table-cell">
          <DateCell date={member.date_of_birth || null} />
        </TableCell>
      )}

      {/* Member Type */}
      {columnVisibility.memberType && (
        <TableCell>
          <MemberTypeBadge type={member.member_type as "full" | "trial"} />
        </TableCell>
      )}

      {/* Status */}
      <TableCell onClick={handleStatusClick}>
        <MemberStatusBadge
          status={member.status}
          memberId={member.id}
          readonly={!showActions}
        />
      </TableCell>

      {/* Subscription End Date */}
      {columnVisibility.subscriptionEnd && (
        <TableCell className="hidden lg:table-cell">
          <DateCell date={member.active_subscription?.end_date || null} />
        </TableCell>
      )}

      {/* Last Session */}
      {columnVisibility.lastSession && (
        <TableCell className="hidden lg:table-cell">
          <DateCell
            date={member.session_stats?.last_session_date || null}
            format="short"
          />
        </TableCell>
      )}

      {/* Next Session */}
      {columnVisibility.nextSession && (
        <TableCell className="hidden lg:table-cell">
          <DateCell
            date={member.session_stats?.next_session_date || null}
            format="short"
          />
        </TableCell>
      )}

      {/* Remaining Sessions */}
      {columnVisibility.remainingSessions && (
        <TableCell className="hidden lg:table-cell">
          <SessionCountBadge
            count={member.active_subscription?.remaining_sessions || 0}
            showTooltip={false}
            colorVariant="yellow"
          />
        </TableCell>
      )}

      {/* Scheduled Sessions */}
      {columnVisibility.scheduledSessions && (
        <TableCell className="hidden lg:table-cell">
          <SessionCountBadge
            count={member.session_stats?.scheduled_sessions_count || 0}
            showTooltip={false}
          />
        </TableCell>
      )}

      {/* Balance Due */}
      {columnVisibility.balanceDue && (
        <TableCell className="hidden lg:table-cell">
          <div
            className={cn(
              "inline-block rounded-md px-3 py-1 text-sm font-medium",
              balanceStyles.backgroundColor,
              balanceStyles.textColor
            )}
          >
            {formatBalance(balance)}
          </div>
        </TableCell>
      )}

      {/* Last Payment */}
      {columnVisibility.lastPayment && (
        <TableCell className="hidden xl:table-cell">
          <DateCell date={member.last_payment_date} />
        </TableCell>
      )}

      {/* Actions */}
      {showActions && (
        <TableCell onClick={handleActionsClick}>
          <div className="flex items-center space-x-1">
            <AddSessionButton
              member={member}
              onSuccess={onRefresh}
              variant="ghost"
              size="sm"
            />
            <AddPaymentButton
              member={member}
              onSuccess={onRefresh}
              variant="ghost"
              size="sm"
            />
          </div>
        </TableCell>
      )}
    </TableRow>
  );
});
