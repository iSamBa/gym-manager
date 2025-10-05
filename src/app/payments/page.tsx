"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import {
  Search,
  Download,
  Plus,
  Calendar as CalendarIcon,
  Eye,
  Undo2,
} from "lucide-react";

import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { useAllPayments } from "@/features/payments/hooks/use-all-payments";
import type {
  PaymentMethod,
  PaymentStatus,
} from "@/features/database/lib/types";
import type { AllPaymentsResponse } from "@/features/payments/hooks/use-all-payments";
import { useRequireAdmin } from "@/hooks/use-require-auth";
import { RecordPaymentDialog } from "@/features/payments/components/RecordPaymentDialog";
import { PaymentReceiptDialog } from "@/features/payments/components/PaymentReceiptDialog";
import { RefundDialog } from "@/features/payments/components/RefundDialog";

export default function PaymentsManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | "all">(
    "all"
  );
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">(
    "all"
  );
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<
    AllPaymentsResponse["payments"][0] | null
  >(null);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const pageSize = 50;

  // Require admin role for entire page
  const {
    user,
    isLoading: isAuthLoading,
    hasRequiredRole,
  } = useRequireAdmin("/login");

  const { data: paymentsData, isLoading } = useAllPayments({
    search: searchTerm,
    paymentMethod: methodFilter === "all" ? undefined : methodFilter,
    paymentStatus: statusFilter === "all" ? undefined : statusFilter,
    startDate: dateRange?.from?.toISOString(),
    endDate: dateRange?.to?.toISOString(),
    page: currentPage,
    limit: pageSize,
  });

  if (isAuthLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
        </div>
      </MainLayout>
    );
  }

  if (!hasRequiredRole) {
    return null; // Will redirect to login
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-10 w-48" />
            </div>
            <Skeleton className="h-[500px] w-full" />
          </div>
        </div>
      </MainLayout>
    );
  }

  const payments = paymentsData?.payments || [];
  const totalCount = paymentsData?.totalCount || 0;
  const summary = paymentsData?.summary || {
    totalRevenue: 0,
    totalRefunded: 0,
    paymentCount: 0,
  };

  // Action handlers
  const handleViewReceipt = (payment: AllPaymentsResponse["payments"][0]) => {
    setSelectedPayment(payment);
    setShowReceiptDialog(true);
  };

  const handleRefund = (payment: AllPaymentsResponse["payments"][0]) => {
    setSelectedPayment(payment);
    setShowRefundDialog(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
            <p className="text-muted-foreground">
              Track and manage all payment transactions
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button onClick={() => setIsRecordDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                ${summary.totalRevenue.toFixed(2)}
              </div>
              <p className="text-muted-foreground text-xs">Total Revenue</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{summary.paymentCount}</div>
              <p className="text-muted-foreground text-xs">Total Payments</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">
                -${summary.totalRefunded.toFixed(2)}
              </div>
              <p className="text-muted-foreground text-xs">Total Refunded</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                ${(summary.totalRevenue - summary.totalRefunded).toFixed(2)}
              </div>
              <p className="text-muted-foreground text-xs">Net Revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
            <Input
              placeholder="Search payments, receipts, or members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={methodFilter}
            onValueChange={(value) =>
              setMethodFilter(value as PaymentMethod | "all")
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Payment Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="check">Check</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as PaymentStatus | "all")
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-48">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd")} -{" "}
                      {format(dateRange.to, "LLL dd")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  "Date Range"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Payments Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow
                    key={payment.id}
                    className={
                      payment.is_refund ? "bg-red-50 dark:bg-red-950/20" : ""
                    }
                  >
                    <TableCell className="font-mono text-sm">
                      {payment.receipt_number}
                      {payment.is_refund && (
                        <Badge
                          variant="outline"
                          className="ml-2 border-red-200 text-xs text-red-600"
                        >
                          Refund
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {payment.member
                        ? `${payment.member.first_name} ${payment.member.last_name}`
                        : "N/A"}
                      {payment.description && (
                        <div className="text-muted-foreground mt-1 text-xs">
                          {payment.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <span className={payment.is_refund ? "text-red-600" : ""}>
                        {payment.is_refund ? "-" : ""}$
                        {Math.abs(payment.amount).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          payment.payment_status === "completed"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {payment.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {payment.payment_method.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-3">
                        <Eye
                          className="text-muted-foreground hover:text-foreground h-4 w-4 cursor-pointer"
                          onClick={() => handleViewReceipt(payment)}
                        />
                        <Download
                          className="text-muted-foreground hover:text-foreground h-4 w-4 cursor-pointer"
                          onClick={() => handleViewReceipt(payment)}
                        />
                        {payment.payment_status === "completed" &&
                          !payment.is_refund && (
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
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalCount > pageSize && (
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, totalCount)} of {totalCount}{" "}
              payments
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage * pageSize >= totalCount}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Record Payment Dialog */}
        <RecordPaymentDialog
          open={isRecordDialogOpen}
          onOpenChange={setIsRecordDialogOpen}
        />

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
      </div>
    </MainLayout>
  );
}
