"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { Receipt, Undo2, Download, Eye } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

import type { SubscriptionPaymentWithReceiptAndPlan } from "@/features/database/lib/types";
import { PaymentReceiptDialog } from "./PaymentReceiptDialog";
import { RefundDialog } from "./RefundDialog";

interface PaymentHistoryTableProps {
  payments: SubscriptionPaymentWithReceiptAndPlan[];
  isLoading?: boolean;
  showMemberColumn?: boolean;
  showSubscriptionColumn?: boolean;
}

export function PaymentHistoryTable({
  payments,
  isLoading,
  showMemberColumn = false,
  showSubscriptionColumn = false,
}: PaymentHistoryTableProps) {
  const [selectedPayment, setSelectedPayment] =
    useState<SubscriptionPaymentWithReceiptAndPlan | null>(null);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-12 w-full"
                data-testid="skeleton"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!payments.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Receipt}
            title="No payments found"
            description="No payment records available for this period."
          />
        </CardContent>
      </Card>
    );
  }

  const getPaymentMethodBadge = (method: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      cash: "default",
      card: "secondary",
      bank_transfer: "outline",
      online: "secondary",
      check: "outline",
    };

    return (
      <Badge variant={variants[method] || "outline"}>
        {method.replace("_", " ")}
      </Badge>
    );
  };

  const getStatusBadge = (status: string, refundAmount?: number) => {
    if (status === "refunded") {
      return <Badge variant="destructive">Refunded</Badge>;
    }
    if (status === "completed" && refundAmount && refundAmount > 0) {
      return <Badge variant="outline">Partial Refund</Badge>;
    }
    if (status === "completed") {
      return <Badge variant="default">Completed</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  const handleViewReceipt = (
    payment: SubscriptionPaymentWithReceiptAndPlan
  ) => {
    setSelectedPayment(payment);
    setShowReceiptDialog(true);
  };

  const handleDownloadReceipt = async (
    payment: SubscriptionPaymentWithReceiptAndPlan
  ) => {
    // Dynamically import PDF generator to reduce initial bundle size
    const { generatePaymentReceiptPDF } = await import("../lib/pdf-generator");

    generatePaymentReceiptPDF({ payment });
  };

  const handleRefund = (payment: SubscriptionPaymentWithReceiptAndPlan) => {
    setSelectedPayment(payment);
    setShowRefundDialog(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Receipt #</TableHead>
                  {showMemberColumn && <TableHead>Member</TableHead>}
                  {showSubscriptionColumn && <TableHead>Plan</TableHead>}
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {payment.payment_date
                        ? format(new Date(payment.payment_date), "MMM dd, yyyy")
                        : "N/A"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {payment.receipt_number}
                    </TableCell>
                    {showMemberColumn && (
                      <TableCell>
                        {/* Member name would come from a join or separate query */}
                        Member #{payment.member_id.slice(-8)}
                      </TableCell>
                    )}
                    {showSubscriptionColumn && (
                      <TableCell>
                        {payment.member_subscriptions?.plan_name_snapshot ||
                          "N/A"}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          ${payment.amount.toFixed(2)}
                        </div>
                        {payment.refund_amount && payment.refund_amount > 0 && (
                          <div className="text-sm text-red-600">
                            -${payment.refund_amount.toFixed(2)} refunded
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPaymentMethodBadge(payment.payment_method)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(
                        payment.payment_status,
                        payment.refund_amount
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-3">
                        <Eye
                          className="text-muted-foreground hover:text-foreground h-4 w-4 cursor-pointer"
                          onClick={() => handleViewReceipt(payment)}
                        />
                        <Download
                          className="text-muted-foreground hover:text-foreground h-4 w-4 cursor-pointer"
                          onClick={() => handleDownloadReceipt(payment)}
                        />
                        {payment.payment_status === "completed" && (
                          <Undo2
                            className="h-4 w-4 cursor-pointer text-red-500 hover:text-red-600"
                            onClick={() => handleRefund(payment)}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Receipt Dialog */}
      {selectedPayment && (
        <PaymentReceiptDialog
          payment={selectedPayment}
          open={showReceiptDialog}
          onOpenChange={setShowReceiptDialog}
        />
      )}

      {/* Refund Dialog */}
      {selectedPayment && (
        <RefundDialog
          payment={selectedPayment}
          open={showRefundDialog}
          onOpenChange={setShowRefundDialog}
          onSuccess={() => {
            setShowRefundDialog(false);
            setSelectedPayment(null);
          }}
        />
      )}
    </>
  );
}
