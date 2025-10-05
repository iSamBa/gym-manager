"use client";

import React, { useState } from "react";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Package,
} from "lucide-react";

import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

import { useSubscriptionPlans } from "@/features/memberships/hooks/use-subscriptions";
import type { SubscriptionPlanWithSessions } from "@/features/database/lib/types";
import { useRequireAdmin } from "@/hooks/use-require-auth";

import { PlanEditDialog } from "@/features/plans/components/PlanEditDialog";
import { PlanDeleteDialog } from "@/features/plans/components/PlanDeleteDialog";

export default function PlansManagementPage() {
  const [editingPlan, setEditingPlan] =
    useState<SubscriptionPlanWithSessions | null>(null);
  const [deletingPlan, setDeletingPlan] =
    useState<SubscriptionPlanWithSessions | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  // Require admin role for entire page
  const { isLoading: isAuthLoading, hasRequiredRole } =
    useRequireAdmin("/login");

  const { data: allPlans, isLoading, error } = useSubscriptionPlans();

  // Filter plans based on show inactive toggle
  const plans =
    allPlans?.filter((plan) => showInactive || plan.is_active) || [];

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
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load subscription plans. Please try again.
          </AlertDescription>
        </Alert>
      </MainLayout>
    );
  }

  const handleCreatePlan = () => {
    setEditingPlan({} as SubscriptionPlanWithSessions);
  };

  const handleEditPlan = (plan: SubscriptionPlanWithSessions) => {
    setEditingPlan(plan);
  };

  const handleDeletePlan = (plan: SubscriptionPlanWithSessions) => {
    setDeletingPlan(plan);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Subscription Plans
            </h1>
            <p className="text-muted-foreground">
              Manage subscription plans and pricing
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInactive(!showInactive)}
            >
              {showInactive ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Hide Inactive
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Show Inactive
                </>
              )}
            </Button>
            <Button onClick={handleCreatePlan}>
              <Plus className="mr-2 h-4 w-4" />
              New Plan
            </Button>
          </div>
        </div>

        {/* Plans Grid */}
        {plans.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <EmptyState
                icon={Package}
                title="No Plans Found"
                description={
                  showInactive
                    ? "No plans match the current filter."
                    : "No active plans found."
                }
                action={
                  <Button onClick={handleCreatePlan}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Plan
                  </Button>
                }
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <Badge variant={plan.is_active ? "default" : "secondary"}>
                        {plan.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditPlan(plan)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Plan
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeletePlan(plan)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Plan
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Pricing */}
                  <div className="text-center">
                    <div className="text-3xl font-bold">${plan.price}</div>
                  </div>

                  {/* Plan Details */}
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sessions:</span>
                      <span className="font-medium">{plan.sessions_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">
                        {plan.duration_months} months
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Signup Fee:</span>
                      <span className="font-medium">${plan.signup_fee}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialogs */}
        {editingPlan && (
          <PlanEditDialog
            plan={editingPlan.id ? editingPlan : null}
            open={!!editingPlan}
            onOpenChange={(open) => !open && setEditingPlan(null)}
          />
        )}

        {deletingPlan && (
          <PlanDeleteDialog
            plan={deletingPlan}
            open={!!deletingPlan}
            onOpenChange={(open) => !open && setDeletingPlan(null)}
          />
        )}
      </div>
    </MainLayout>
  );
}
