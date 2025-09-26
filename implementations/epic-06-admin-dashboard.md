# Epic 6: Admin Dashboard & Management Pages

## Overview

Create comprehensive admin tools for managing subscription plans, monitoring subscriptions, and payment oversight with dedicated sidebar navigation pages.

## Technical Requirements

### 6.1 Sidebar Navigation Updates

**src/components/layout/sidebar.tsx** (additions)

```typescript
// Add new imports for icons
import { Package, CreditCard, DollarSign } from "lucide-react";

// Add to the navigation items array
const navigationItems = [
  // ... existing items
  {
    title: "Plans",
    href: "/plans",
    icon: Package,
    description: "Manage subscription plans",
  },
  {
    title: "Subscriptions",
    href: "/subscriptions",
    icon: CreditCard,
    description: "View and manage member subscriptions",
  },
  {
    title: "Payments",
    href: "/payments",
    icon: DollarSign,
    description: "Track and manage payments",
  },
  // ... other items
];
```

### 6.2 Plans Management Page

**src/app/plans/page.tsx**

```typescript
'use client';

import React, { useState } from 'react';
import { Plus, MoreHorizontal, Edit, Trash2, Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

import { useSubscriptionPlans } from '@/features/memberships/hooks/use-subscriptions';
import type { SubscriptionPlanWithSessions } from '@/features/database/lib/types';

import { PlanEditDialog } from '@/features/plans/components/PlanEditDialog';
import { PlanDeleteDialog } from '@/features/plans/components/PlanDeleteDialog';

export default function PlansManagementPage() {
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanWithSessions | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<SubscriptionPlanWithSessions | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const { data: allPlans, isLoading, error } = useSubscriptionPlans();

  // Filter plans based on show inactive toggle
  const plans = allPlans?.filter(plan => showInactive || plan.is_active) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load subscription plans. Please try again.
        </AlertDescription>
      </Alert>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription Plans</h1>
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
              description={showInactive ? "No plans match the current filter." : "No active plans found."}
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
                    <div className="flex gap-2">
                      <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">
                        {plan.plan_type}
                      </Badge>
                    </div>
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
                  <div className="text-sm text-muted-foreground">
                    {plan.billing_cycle.replace('_', ' ')}
                  </div>
                </div>

                {/* Plan Details */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sessions:</span>
                    <span className="font-medium">{plan.sessions_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium">{plan.duration_days || 30} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Per Session:</span>
                    <span className="font-medium">
                      ${(plan.price / plan.sessions_count).toFixed(2)}
                    </span>
                  </div>
                  {plan.signup_fee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Signup Fee:</span>
                      <span className="font-medium">${plan.signup_fee}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {plan.description && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {plan.description}
                    </p>
                  </div>
                )}

                {/* Features */}
                {plan.access_hours && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Access: {plan.access_hours.start} - {plan.access_hours.end}
                    </p>
                  </div>
                )}
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
  );
}
```

### 6.3 Plan Edit Dialog

**src/features/plans/components/PlanEditDialog.tsx**

```typescript
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { SubscriptionPlanWithSessions } from '@/features/database/lib/types';
import { usePlanMutations } from '../hooks/use-plan-mutations';

const planFormSchema = z.object({
  name: z.string().min(1, 'Plan name is required').max(100),
  description: z.string().max(500).optional(),
  plan_type: z.enum(['basic', 'premium', 'vip', 'student', 'senior', 'corporate']),
  sessions_count: z.number().min(1, 'Must have at least 1 session'),
  price: z.number().min(0, 'Price must be positive'),
  duration_days: z.number().min(1, 'Duration must be at least 1 day'),
  billing_cycle: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'semi_annual', 'annual']),
  signup_fee: z.number().min(0, 'Signup fee must be positive'),
  is_active: z.boolean(),
  auto_renew: z.boolean(),
  sort_order: z.number().min(0),
});

type PlanFormData = z.infer<typeof planFormSchema>;

interface PlanEditDialogProps {
  plan: SubscriptionPlanWithSessions | null; // null for creating new plan
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlanEditDialog({ plan, open, onOpenChange }: PlanEditDialogProps) {
  const isEditing = !!plan?.id;
  const { createPlanMutation, updatePlanMutation } = usePlanMutations();

  const form = useForm<PlanFormData>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: plan?.name || '',
      description: plan?.description || '',
      plan_type: plan?.plan_type || 'basic',
      sessions_count: plan?.sessions_count || 10,
      price: plan?.price || 0,
      duration_days: plan?.duration_days || 30,
      billing_cycle: plan?.billing_cycle || 'monthly',
      signup_fee: plan?.signup_fee || 0,
      is_active: plan?.is_active ?? true,
      auto_renew: plan?.auto_renew ?? true,
      sort_order: plan?.sort_order || 0,
    },
  });

  const watchedValues = form.watch();
  const pricePerSession = watchedValues.sessions_count > 0
    ? watchedValues.price / watchedValues.sessions_count
    : 0;

  const onSubmit = async (data: PlanFormData) => {
    try {
      if (isEditing) {
        await updatePlanMutation.mutateAsync({
          id: plan.id,
          ...data,
        });
      } else {
        await createPlanMutation.mutateAsync(data);
      }

      form.reset();
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the mutations
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Plan' : 'Create New Plan'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the subscription plan details. Changes will not affect existing subscriptions.'
              : 'Create a new subscription plan for members to purchase.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Premium Monthly" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="plan_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="vip">VIP</SelectItem>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="senior">Senior</SelectItem>
                          <SelectItem value="corporate">Corporate</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what's included in this plan..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Pricing & Sessions */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Pricing & Sessions</h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sessions_count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Sessions</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="duration_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (Days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        How long the plan remains valid
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="signup_fee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Signup Fee</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        One-time fee for new members
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Pricing Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pricing Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Price per session:</span>
                      <span className="ml-2 font-bold">${pricePerSession.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total with signup fee:</span>
                      <span className="ml-2 font-bold">
                        ${(watchedValues.price + watchedValues.signup_fee).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Settings</h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="billing_cycle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Cycle</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="semi_annual">Semi-Annual</SelectItem>
                          <SelectItem value="annual">Annual</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sort_order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sort Order</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Display order (lower numbers first)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Plan</FormLabel>
                        <FormDescription>
                          Allow new members to purchase this plan
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="auto_renew"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Auto-Renewal</FormLabel>
                        <FormDescription>
                          Automatically renew subscriptions when they expire
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
                className="flex-1"
              >
                {createPlanMutation.isPending || updatePlanMutation.isPending
                  ? (isEditing ? 'Updating...' : 'Creating...')
                  : (isEditing ? 'Update Plan' : 'Create Plan')
                }
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

### 6.4 Subscriptions Management Page

**src/app/subscriptions/page.tsx**

```typescript
'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Pause,
  Play,
  CreditCard,
  ArrowUpRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { useAllSubscriptions } from '@/features/memberships/hooks/use-all-subscriptions';
import { usePauseSubscription, useResumeSubscription } from '@/features/memberships/hooks/use-subscriptions';
import type { MemberSubscriptionWithSnapshot, SubscriptionStatus } from '@/features/database/lib/types';

export default function SubscriptionsManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const {
    data: subscriptionsData,
    isLoading,
    error
  } = useAllSubscriptions({
    search: searchTerm,
    status: statusFilter === 'all' ? undefined : statusFilter,
    page: currentPage,
    limit: pageSize,
  });

  const pauseSubscriptionMutation = usePauseSubscription();
  const resumeSubscriptionMutation = useResumeSubscription();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
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
    );
  }

  const subscriptions = subscriptionsData?.subscriptions || [];
  const totalCount = subscriptionsData?.totalCount || 0;

  const getStatusBadge = (status: SubscriptionStatus) => {
    const variants = {
      active: 'default',
      paused: 'secondary',
      completed: 'outline',
      cancelled: 'destructive',
      expired: 'destructive',
      pending: 'secondary',
    } as const;

    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const calculateProgress = (subscription: MemberSubscriptionWithSnapshot) => {
    return (subscription.used_sessions / subscription.total_sessions_snapshot) * 100;
  };

  const calculatePaymentProgress = (subscription: MemberSubscriptionWithSnapshot) => {
    return (subscription.paid_amount / subscription.total_amount_snapshot) * 100;
  };

  const handlePauseResume = async (subscription: MemberSubscriptionWithSnapshot) => {
    if (subscription.status === 'active') {
      await pauseSubscriptionMutation.mutateAsync({
        subscriptionId: subscription.id,
        reason: 'Paused by admin'
      });
    } else if (subscription.status === 'paused') {
      await resumeSubscriptionMutation.mutateAsync(subscription.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground">
            Manage all member subscriptions
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {subscriptions.filter(s => s.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">Active Subscriptions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {subscriptions.filter(s => s.status === 'paused').length}
            </div>
            <p className="text-xs text-muted-foreground">Paused Subscriptions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              ${subscriptions
                .filter(s => s.paid_amount < s.total_amount_snapshot)
                .reduce((sum, s) => sum + (s.total_amount_snapshot - s.paid_amount), 0)
                .toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">Outstanding Balance</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {subscriptions.reduce((sum, s) => sum + (s.total_sessions_snapshot - s.used_sessions), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Remaining Sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
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
                <TableHead>Plan</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">
                        {subscription.members?.first_name} {subscription.members?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {subscription.members?.email}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{subscription.plan_name_snapshot}</p>
                      <p className="text-sm text-muted-foreground">
                        ${subscription.total_amount_snapshot.toFixed(2)}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{subscription.used_sessions} / {subscription.total_sessions_snapshot}</span>
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
                        <span>${subscription.paid_amount.toFixed(2)}</span>
                        <span className="text-muted-foreground">
                          {calculatePaymentProgress(subscription).toFixed(0)}%
                        </span>
                      </div>
                      <Progress
                        value={calculatePaymentProgress(subscription)}
                        className="h-1"
                      />
                      {subscription.paid_amount < subscription.total_amount_snapshot && (
                        <p className="text-xs text-orange-600">
                          Due: ${(subscription.total_amount_snapshot - subscription.paid_amount).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    {getStatusBadge(subscription.status)}
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => window.location.href = `/members/${subscription.member_id}`}
                        >
                          View Member
                        </DropdownMenuItem>

                        {subscription.status === 'active' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handlePauseResume(subscription)}>
                              <Pause className="mr-2 h-4 w-4" />
                              Pause Subscription
                            </DropdownMenuItem>
                          </>
                        )}

                        {subscription.status === 'paused' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handlePauseResume(subscription)}>
                              <Play className="mr-2 h-4 w-4" />
                              Resume Subscription
                            </DropdownMenuItem>
                          </>
                        )}

                        {subscription.paid_amount < subscription.total_amount_snapshot && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Add Payment
                            </DropdownMenuItem>
                          </>
                        )}

                        {subscription.status === 'active' && (
                          <DropdownMenuItem>
                            <ArrowUpRight className="mr-2 h-4 w-4" />
                            Upgrade Plan
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} subscriptions
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
    </div>
  );
}
```

### 6.5 Payments Management Page

**src/app/payments/page.tsx**

```typescript
'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Search,
  Download,
  Plus,
  Filter,
  Calendar as CalendarIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { useAllPayments } from '@/features/payments/hooks/use-all-payments';
import { PaymentHistoryTable } from '@/features/payments/components/PaymentHistoryTable';
import type { PaymentMethod, PaymentStatus } from '@/features/database/lib/types';

export default function PaymentsManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const {
    data: paymentsData,
    isLoading,
    error
  } = useAllPayments({
    search: searchTerm,
    paymentMethod: methodFilter === 'all' ? undefined : methodFilter,
    paymentStatus: statusFilter === 'all' ? undefined : statusFilter,
    startDate: dateRange.from?.toISOString(),
    endDate: dateRange.to?.toISOString(),
    page: currentPage,
    limit: pageSize,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
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
    );
  }

  const payments = paymentsData?.payments || [];
  const totalCount = paymentsData?.totalCount || 0;
  const summary = paymentsData?.summary || {
    totalRevenue: 0,
    totalRefunded: 0,
    paymentCount: 0,
  };

  return (
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
          <Button>
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
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {summary.paymentCount}
            </div>
            <p className="text-xs text-muted-foreground">Total Payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              -${summary.totalRefunded.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Total Refunded</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              ${(summary.totalRevenue - summary.totalRefunded).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Net Revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search payments, receipts, or members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={methodFilter} onValueChange={setMethodFilter}>
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

        <Select value={statusFilter} onValueChange={setStatusFilter}>
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
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'LLL dd')} -{' '}
                    {format(dateRange.to, 'LLL dd')}
                  </>
                ) : (
                  format(dateRange.from, 'LLL dd, y')
                )
              ) : (
                'Date Range'
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Payments Table */}
      <PaymentHistoryTable
        payments={payments}
        isLoading={isLoading}
        showMemberColumn={true}
        showSubscriptionColumn={true}
      />

      {/* Pagination */}
      {totalCount > pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} payments
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
    </div>
  );
}
```

## Implementation Checklist

### Navigation & Routes

- [ ] Update sidebar navigation with new menu items
- [ ] Create app routes for plans, subscriptions, payments pages
- [ ] Add proper page layouts and breadcrumbs
- [ ] Test navigation flow between pages

### Plans Management

- [ ] Create plans management page with grid layout
- [ ] Build plan creation and editing dialog
- [ ] Add plan deletion with confirmation
- [ ] Implement plan activation/deactivation
- [ ] Add plan sorting and filtering

### Subscriptions Management

- [ ] Build subscriptions overview page with table
- [ ] Add search and filtering capabilities
- [ ] Implement subscription status management
- [ ] Add bulk operations for subscriptions
- [ ] Create subscription summary statistics

### Payments Management

- [ ] Create payments overview page
- [ ] Add payment search and filtering
- [ ] Implement date range filtering
- [ ] Add payment method and status filters
- [ ] Create payment summary statistics

### Data Management Hooks

- [ ] Create useAllSubscriptions hook with pagination
- [ ] Build useAllPayments hook with filtering
- [ ] Add usePlanMutations for CRUD operations
- [ ] Implement proper cache invalidation
- [ ] Add error handling and loading states

### Testing

- [ ] Test all admin page functionality
- [ ] Test pagination and filtering
- [ ] Test CRUD operations on plans
- [ ] Test subscription management actions
- [ ] Test payment tracking and refunds

## Success Criteria

1. All admin pages are accessible via sidebar navigation
2. Plans can be created, edited, and managed effectively
3. Subscriptions can be viewed, filtered, and managed
4. Payments can be tracked and searched efficiently
5. Summary statistics display accurate information
6. Pagination works properly for large datasets
7. All actions provide appropriate user feedback
8. Pages are responsive and performant
