"use client";

import React from "react";
import { CreditCard } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

import { useMemberPayments } from "@/features/payments/hooks/use-payments";
import { PaymentHistoryTable } from "@/features/payments/components/PaymentHistoryTable";
import type { Member } from "@/features/database/lib/types";

interface MemberPaymentsProps {
  member: Member;
}

export function MemberPayments({ member }: MemberPaymentsProps) {
  const { data: payments, isLoading, error } = useMemberPayments(member?.id);

  // Handle null/undefined member
  if (!member || !member.id) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Member information is not available.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" data-testid="skeleton" />
        <Skeleton className="h-[400px] w-full" data-testid="skeleton" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load payment history. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <Card className="rounded-lg border">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={CreditCard}
            title="No Payments Found"
            description="No payment records found for this member."
          />
        </CardContent>
      </Card>
    );
  }

  // Calculate payment summary
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalRefunded = payments.reduce(
    (sum, payment) => sum + (payment.refund_amount || 0),
    0
  );
  const netPaid = totalPaid - totalRefunded;

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="rounded-lg border">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">${totalPaid.toFixed(2)}</div>
            <p className="text-muted-foreground text-xs">Total Paid</p>
          </CardContent>
        </Card>

        {totalRefunded > 0 && (
          <Card className="rounded-lg border">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">
                -${totalRefunded.toFixed(2)}
              </div>
              <p className="text-muted-foreground text-xs">Total Refunded</p>
            </CardContent>
          </Card>
        )}

        <Card className="rounded-lg border">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              ${netPaid.toFixed(2)}
            </div>
            <p className="text-muted-foreground text-xs">Net Paid</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment History Table */}
      <PaymentHistoryTable
        payments={payments}
        isLoading={isLoading}
        showSubscriptionColumn={true}
      />
    </div>
  );
}
