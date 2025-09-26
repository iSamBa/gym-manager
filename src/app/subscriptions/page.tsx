"use client";

import React, { useState } from "react";
import {
  Search,
  Download,
  Pause,
  Play,
  CreditCard,
  ArrowUpRight,
  Plus,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { useAllSubscriptions } from "@/features/memberships/hooks/use-all-subscriptions";
import {
  usePauseSubscription,
  useResumeSubscription,
} from "@/features/memberships/hooks/use-subscriptions";
import { AddSubscriptionDialog } from "@/features/memberships/components";
import { RecordPaymentDialog } from "@/features/payments/components/RecordPaymentDialog";
import type {
  MemberSubscriptionWithSnapshot,
  SubscriptionStatus,
} from "@/features/database/lib/types";
import { useRequireAdmin } from "@/hooks/use-require-auth";
import { mapUserForLayout } from "@/lib/auth-utils";

export default function SubscriptionsManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | "all">(
    "all"
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddSubscriptionDialog, setShowAddSubscriptionDialog] =
    useState(false);
  const [showRecordPaymentDialog, setShowRecordPaymentDialog] = useState(false);
  const [selectedSubscriptionForPayment, setSelectedSubscriptionForPayment] =
    useState<MemberSubscriptionWithSnapshot | null>(null);
  const pageSize = 20;

  // Require admin role for entire page
  const {
    user,
    isLoading: isAuthLoading,
    hasRequiredRole,
  } = useRequireAdmin("/login");

  const { data: subscriptionsData, isLoading } = useAllSubscriptions({
    search: searchTerm,
    status: statusFilter === "all" ? undefined : statusFilter,
    page: currentPage,
    limit: pageSize,
  });

  const pauseSubscriptionMutation = usePauseSubscription();
  const resumeSubscriptionMutation = useResumeSubscription();

  if (isAuthLoading) {
    return (
      <MainLayout user={mapUserForLayout(user)}>
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
      <MainLayout user={mapUserForLayout(user)}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-48" />
            </div>
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </MainLayout>
    );
  }

  const subscriptions = subscriptionsData?.subscriptions || [];
  const totalCount = subscriptionsData?.totalCount || 0;

  const getStatusBadge = (status: SubscriptionStatus) => {
    const variants = {
      active: "default",
      paused: "secondary",
      completed: "outline",
      cancelled: "destructive",
      expired: "destructive",
      pending: "secondary",
    } as const;

    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const calculateProgress = (subscription: MemberSubscriptionWithSnapshot) => {
    const used = subscription.used_sessions || 0;
    const total = subscription.total_sessions_snapshot || 1;
    return (used / total) * 100;
  };

  const calculatePaymentProgress = (
    subscription: MemberSubscriptionWithSnapshot
  ) => {
    const paid = subscription.paid_amount || 0;
    const total = subscription.total_amount_snapshot || 1;
    return (paid / total) * 100;
  };

  const handlePauseResume = async (
    subscription: MemberSubscriptionWithSnapshot
  ) => {
    try {
      if (subscription.status === "active") {
        await pauseSubscriptionMutation.mutateAsync({
          subscriptionId: subscription.id,
          reason: "Paused by admin",
        });
      } else if (subscription.status === "paused") {
        await resumeSubscriptionMutation.mutateAsync(subscription.id);
      }
      // The mutations already handle the toast notifications and cache invalidation
    } catch (error) {
      console.error("Error updating subscription status:", error);
    }
  };

  // Convert user object to expected format for MainLayout
  const layoutUser = mapUserForLayout(user);

  return (
    <MainLayout user={layoutUser}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
            <p className="text-muted-foreground">
              Manage all member subscriptions
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button onClick={() => setShowAddSubscriptionDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Subscription
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {subscriptions.filter((s) => s.status === "active").length}
              </div>
              <p className="text-muted-foreground text-xs">
                Active Subscriptions
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {subscriptions.filter((s) => s.status === "paused").length}
              </div>
              <p className="text-muted-foreground text-xs">
                Paused Subscriptions
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                $
                {subscriptions
                  .filter((s) => s.paid_amount < s.total_amount_snapshot)
                  .reduce(
                    (sum, s) => sum + (s.total_amount_snapshot - s.paid_amount),
                    0
                  )
                  .toFixed(0)}
              </div>
              <p className="text-muted-foreground text-xs">
                Outstanding Balance
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {subscriptions.reduce(
                  (sum, s) =>
                    sum + (s.total_sessions_snapshot - s.used_sessions),
                  0
                )}
              </div>
              <p className="text-muted-foreground text-xs">
                Remaining Sessions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as SubscriptionStatus | "all")
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Subscriptions Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-[180px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">
                          {subscription.members
                            ? `${subscription.members.first_name} ${subscription.members.last_name}`
                            : `Member #${subscription.member_id.slice(-8)}`}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {subscription.members?.email ||
                            subscription.member_id}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>{getStatusBadge(subscription.status)}</TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">
                          {subscription.plan_name_snapshot || "Unknown Plan"}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          $
                          {subscription.total_amount_snapshot?.toFixed(2) ||
                            "0.00"}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>
                            {subscription.used_sessions || 0} /{" "}
                            {subscription.total_sessions_snapshot || 0}
                          </span>
                          <span className="text-muted-foreground">
                            {calculateProgress(subscription).toFixed(0)}%
                          </span>
                        </div>
                        <Progress
                          value={calculateProgress(subscription)}
                          className="h-1"
                        />
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>
                            ${subscription.paid_amount?.toFixed(2) || "0.00"}
                          </span>
                          <span className="text-muted-foreground">
                            {calculatePaymentProgress(subscription).toFixed(0)}%
                          </span>
                        </div>
                        <Progress
                          value={calculatePaymentProgress(subscription)}
                          className="h-1"
                        />
                        {(subscription.paid_amount || 0) <
                          (subscription.total_amount_snapshot || 0) && (
                          <p className="text-xs text-orange-600">
                            Due: $
                            {(
                              (subscription.total_amount_snapshot || 0) -
                              (subscription.paid_amount || 0)
                            ).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {subscription.end_date ? (
                        <div className="text-sm">
                          {new Date(subscription.end_date).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            (window.location.href = `/members/${subscription.member_id}`)
                          }
                          className="h-8 w-8 p-0"
                          title="View Member"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>

                        {(subscription.status === "active" ||
                          subscription.status === "paused") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePauseResume(subscription)}
                            className="h-8 w-8 p-0"
                            title={
                              subscription.status === "active"
                                ? "Pause"
                                : "Resume"
                            }
                            disabled={
                              pauseSubscriptionMutation.isPending ||
                              resumeSubscriptionMutation.isPending
                            }
                          >
                            {subscription.status === "active" ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                        )}

                        {(subscription.paid_amount || 0) <
                          (subscription.total_amount_snapshot || 0) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedSubscriptionForPayment(subscription);
                              setShowRecordPaymentDialog(true);
                            }}
                            className="h-8 w-8 p-0"
                            title="Add Payment"
                          >
                            <CreditCard className="h-4 w-4" />
                          </Button>
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
              subscriptions
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

        {/* Add Subscription Dialog */}
        <AddSubscriptionDialog
          open={showAddSubscriptionDialog}
          onOpenChange={setShowAddSubscriptionDialog}
        />

        {/* Record Payment Dialog */}
        <RecordPaymentDialog
          open={showRecordPaymentDialog}
          onOpenChange={(open) => {
            setShowRecordPaymentDialog(open);
            if (!open) {
              setSelectedSubscriptionForPayment(null);
            }
          }}
          preSelectedMember={selectedSubscriptionForPayment?.members || null}
          preSelectedSubscriptionId={selectedSubscriptionForPayment?.id || null}
        />
      </div>
    </MainLayout>
  );
}
