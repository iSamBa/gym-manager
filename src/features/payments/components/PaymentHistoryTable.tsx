"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { Receipt, Undo2, Download, Eye, Loader2 } from "lucide-react";

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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

import type { SubscriptionPaymentWithReceiptAndPlan } from "@/features/database/lib/types";
import { PaymentReceiptDialog } from "./PaymentReceiptDialog";
import { RefundDialog } from "./RefundDialog";
import { InvoiceViewDialog } from "./InvoiceViewDialog";
import { useInvoices } from "@/features/invoices/hooks/use-invoices";
import { supabase } from "@/lib/supabase";

interface PaymentHistoryTableProps {
  payments: SubscriptionPaymentWithReceiptAndPlan[];
  isLoading?: boolean;
  showMemberColumn?: boolean;
  showSubscriptionColumn?: boolean;
  // Selection props (optional for backward compatibility)
  showSelection?: boolean;
  selectedPayments?: Set<string>;
  onToggleSelect?: (paymentId: string) => void;
  onSelectAll?: () => void;
}

export function PaymentHistoryTable({
  payments,
  isLoading,
  showMemberColumn = false,
  showSubscriptionColumn = false,
  showSelection = false,
  selectedPayments,
  onToggleSelect,
  onSelectAll,
}: PaymentHistoryTableProps) {
  const [selectedPayment, setSelectedPayment] =
    useState<SubscriptionPaymentWithReceiptAndPlan | null>(null);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [invoicePdfUrl, setInvoicePdfUrl] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [loadingInvoice, setLoadingInvoice] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const { generateInvoice } = useInvoices();

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

  /**
   * Get or generate invoice for a payment, then perform action (view/download)
   */
  const getOrGenerateInvoice = async (
    payment: SubscriptionPaymentWithReceiptAndPlan
  ) => {
    // Check if invoice already exists (get most recent if multiple exist)
    const { data: existingInvoices, error: fetchError } = await supabase
      .from("invoices")
      .select("id, pdf_url, invoice_number")
      .eq("payment_id", payment.id)
      .order("created_at", { ascending: false });

    if (fetchError) {
      throw new Error(`Failed to fetch invoice: ${fetchError.message}`);
    }

    // If invoice(s) exist with PDF URL, return the most recent one
    if (existingInvoices && existingInvoices.length > 0) {
      const invoiceWithPdf = existingInvoices.find((inv) => inv.pdf_url);

      if (invoiceWithPdf) {
        return {
          pdfUrl: invoiceWithPdf.pdf_url,
          invoiceNumber: invoiceWithPdf.invoice_number,
        };
      }

      // Invoice exists but no PDF - this shouldn't happen in normal flow
      // Log warning but continue to generate new invoice
      toast.warning(
        `Found ${existingInvoices.length} incomplete invoice(s). Creating new one...`
      );
    }

    // Invoice doesn't exist or all are incomplete - generate new one
    toast.info("Generating invoice...");

    await generateInvoice({
      payment_id: payment.id,
      member_id: payment.member_id,
      subscription_id: payment.subscription_id,
      amount: payment.amount,
    });

    // Fetch the newly created invoice (get most recent)
    const { data: newInvoices } = await supabase
      .from("invoices")
      .select("pdf_url, invoice_number")
      .eq("payment_id", payment.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!newInvoices || newInvoices.length === 0 || !newInvoices[0].pdf_url) {
      throw new Error("Invoice generated but PDF URL not found");
    }

    return {
      pdfUrl: newInvoices[0].pdf_url,
      invoiceNumber: newInvoices[0].invoice_number,
    };
  };

  const handleViewInvoice = async (
    payment: SubscriptionPaymentWithReceiptAndPlan
  ) => {
    try {
      setLoadingInvoice(payment.id);
      const { pdfUrl, invoiceNumber } = await getOrGenerateInvoice(payment);

      // Open invoice in dialog
      setInvoicePdfUrl(pdfUrl);
      setInvoiceNumber(invoiceNumber);
      setShowInvoiceDialog(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to view invoice"
      );
    } finally {
      setLoadingInvoice(null);
    }
  };

  const handleDownloadInvoice = async (
    payment: SubscriptionPaymentWithReceiptAndPlan
  ) => {
    try {
      setLoadingInvoice(payment.id);
      setIsDownloading(true);
      const { pdfUrl, invoiceNumber } = await getOrGenerateInvoice(payment);

      // Download the PDF
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Invoice downloaded successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to download invoice"
      );
    } finally {
      setLoadingInvoice(null);
      setIsDownloading(false);
    }
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
                  {showSelection && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          selectedPayments?.size === payments.length &&
                          payments.length > 0
                        }
                        onCheckedChange={onSelectAll}
                        aria-label="Select all payments"
                      />
                    </TableHead>
                  )}
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
                    {showSelection && (
                      <TableCell>
                        <Checkbox
                          checked={selectedPayments?.has(payment.id) || false}
                          onCheckedChange={() => onToggleSelect?.(payment.id)}
                          aria-label={`Select payment ${payment.receipt_number}`}
                        />
                      </TableCell>
                    )}
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
                        {loadingInvoice === payment.id ? (
                          <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Eye
                              className="text-muted-foreground hover:text-foreground h-4 w-4 cursor-pointer transition-colors"
                              onClick={() => handleViewInvoice(payment)}
                            />
                            <Download
                              className="text-muted-foreground hover:text-foreground h-4 w-4 cursor-pointer transition-colors"
                              onClick={() => handleDownloadInvoice(payment)}
                            />
                          </>
                        )}
                        {payment.payment_status === "completed" && (
                          <Undo2
                            className="h-4 w-4 cursor-pointer text-red-500 transition-colors hover:text-red-600"
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

      {/* Invoice View Dialog */}
      <InvoiceViewDialog
        pdfUrl={invoicePdfUrl}
        invoiceNumber={invoiceNumber}
        open={showInvoiceDialog}
        onOpenChange={setShowInvoiceDialog}
        onDownload={async () => {
          if (!invoicePdfUrl) return;

          try {
            setIsDownloading(true);
            const response = await fetch(invoicePdfUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `invoice-${invoiceNumber}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success("Invoice downloaded successfully");
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to download invoice"
            );
          } finally {
            setIsDownloading(false);
          }
        }}
        isDownloading={isDownloading}
      />
    </>
  );
}
