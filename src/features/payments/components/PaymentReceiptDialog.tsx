"use client";

import React from "react";
import { format } from "date-fns";
import { Receipt, Download, Printer } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import type { SubscriptionPaymentWithReceipt } from "@/features/database/lib/types";

interface PaymentReceiptDialogProps {
  payment: SubscriptionPaymentWithReceipt;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentReceiptDialog({
  payment,
  open,
  onOpenChange,
}: PaymentReceiptDialogProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Implementation for PDF generation would go here
    console.log("Download receipt for:", payment.receipt_number);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" data-testid="receipt-icon" />
            Payment Receipt
          </DialogTitle>
        </DialogHeader>

        <Card className="border-2">
          <CardHeader className="bg-muted/50 text-center">
            <CardTitle className="text-lg">Gym Management System</CardTitle>
            <p className="text-muted-foreground text-sm">Payment Receipt</p>
          </CardHeader>

          <CardContent className="space-y-4 pt-6">
            {/* Receipt Number & Date */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Receipt Number</p>
                <p className="font-mono font-bold">{payment.receipt_number}</p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground text-sm">Payment Date</p>
                <p className="font-medium">
                  {payment.payment_date
                    ? format(new Date(payment.payment_date), "PPP")
                    : "N/A"}
                </p>
              </div>
            </div>

            <Separator />

            {/* Payment Details */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Paid:</span>
                <span className="text-lg font-bold">
                  ${payment.amount.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method:</span>
                <Badge variant="outline">
                  {payment.payment_method.replace("_", " ")}
                </Badge>
              </div>

              {payment.reference_number && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference:</span>
                  <span className="font-mono text-sm">
                    {payment.reference_number}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge
                  variant={
                    payment.payment_status === "completed"
                      ? "default"
                      : "secondary"
                  }
                >
                  {payment.payment_status}
                </Badge>
              </div>
            </div>

            {/* Refund Information */}
            {payment.refund_amount && payment.refund_amount > 0 && (
              <>
                <Separator />
                <div className="space-y-2 rounded-lg bg-red-50 p-3">
                  <h4 className="font-medium text-red-800">
                    Refund Information
                  </h4>
                  <div className="flex justify-between">
                    <span className="text-red-700">Refund Amount:</span>
                    <span className="font-bold text-red-800">
                      -${payment.refund_amount.toFixed(2)}
                    </span>
                  </div>
                  {payment.refund_date && (
                    <div className="flex justify-between">
                      <span className="text-red-700">Refund Date:</span>
                      <span className="text-red-800">
                        {format(new Date(payment.refund_date), "PPP")}
                      </span>
                    </div>
                  )}
                  {payment.refund_reason && (
                    <div>
                      <span className="text-red-700">Reason:</span>
                      <p className="mt-1 text-sm text-red-800">
                        {payment.refund_reason}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Notes */}
            {payment.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-muted-foreground text-sm">Notes:</p>
                  <p className="mt-1 text-sm">{payment.notes}</p>
                </div>
              </>
            )}

            <Separator />

            {/* Footer */}
            <div className="text-muted-foreground text-center text-xs">
              <p>Thank you for your payment!</p>
              <p>Generated on {format(new Date(), "PPP")}</p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} className="flex-1">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" onClick={handleDownload} className="flex-1">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
