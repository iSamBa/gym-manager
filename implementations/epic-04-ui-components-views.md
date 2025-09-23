# Epic 4: UI Components & Views

## Overview

Create comprehensive member-facing UI with subscription tabs, payment history, and seamless UX using shadcn/ui components, following the existing codebase patterns.

## Technical Requirements

### 4.1 Member Subscriptions Tab Component

**src/features/members/components/MemberSubscriptions.tsx**

```typescript
'use client';

import React, { useState } from 'react';
import { Plus, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

import { useActiveSubscription, useMemberSubscriptionHistory } from '@/features/memberships/hooks/use-subscriptions';
import type { Member } from '@/features/database/lib/types';

import { ActiveSubscriptionCard } from './ActiveSubscriptionCard';
import { SubscriptionHistoryTable } from './SubscriptionHistoryTable';
import { NewSubscriptionDialog } from './NewSubscriptionDialog';

interface MemberSubscriptionsProps {
  member: Member;
}

export function MemberSubscriptions({ member }: MemberSubscriptionsProps) {
  const [showNewSubscriptionDialog, setShowNewSubscriptionDialog] = useState(false);

  const {
    data: activeSubscription,
    isLoading: isLoadingActive,
    error: activeError
  } = useActiveSubscription(member.id);

  const {
    data: subscriptionHistory,
    isLoading: isLoadingHistory,
    error: historyError
  } = useMemberSubscriptionHistory(member.id);

  if (isLoadingActive && isLoadingHistory) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (activeError || historyError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load subscription data. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Subscription Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Current Subscription</h3>
          {!activeSubscription && (
            <Button
              onClick={() => setShowNewSubscriptionDialog(true)}
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Subscription
            </Button>
          )}
        </div>

        {activeSubscription ? (
          <ActiveSubscriptionCard
            subscription={activeSubscription}
            member={member}
          />
        ) : (
          <Card>
            <CardContent className="pt-6">
              <EmptyState
                icon={AlertCircle}
                title="No Active Subscription"
                description="This member doesn't have an active subscription."
                action={
                  <Button onClick={() => setShowNewSubscriptionDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Subscription
                  </Button>
                }
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Subscription History */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Subscription History</h3>
        {subscriptionHistory && subscriptionHistory.length > 0 ? (
          <SubscriptionHistoryTable
            subscriptions={subscriptionHistory}
            isLoading={isLoadingHistory}
          />
        ) : (
          <Card>
            <CardContent className="pt-6">
              <EmptyState
                icon={AlertCircle}
                title="No Subscription History"
                description="No previous subscriptions found for this member."
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* New Subscription Dialog */}
      <NewSubscriptionDialog
        member={member}
        open={showNewSubscriptionDialog}
        onOpenChange={setShowNewSubscriptionDialog}
      />
    </div>
  );
}
```

### 4.2 Active Subscription Card

**src/features/members/components/ActiveSubscriptionCard.tsx**

```typescript
'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Calendar,
  CreditCard,
  Pause,
  Play,
  ArrowUpRight,
  AlertTriangle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import type { MemberSubscriptionWithSnapshot, Member } from '@/features/database/lib/types';
import { paymentUtils } from '@/features/payments/lib/payment-utils';
import { usePauseSubscription, useResumeSubscription } from '@/features/memberships/hooks/use-subscriptions';

import { UpgradeDialog } from './UpgradeDialog';
import { AddPaymentDialog } from './AddPaymentDialog';

interface ActiveSubscriptionCardProps {
  subscription: MemberSubscriptionWithSnapshot;
  member: Member;
}

export function ActiveSubscriptionCard({ subscription, member }: ActiveSubscriptionCardProps) {
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const pauseSubscriptionMutation = usePauseSubscription();
  const resumeSubscriptionMutation = useResumeSubscription();

  // Calculate subscription metrics
  const remainingSessions = Math.max(0, subscription.total_sessions_snapshot - subscription.used_sessions);
  const sessionProgress = (subscription.used_sessions / subscription.total_sessions_snapshot) * 100;
  const balanceInfo = paymentUtils.calculateBalanceInfo(subscription);

  // Calculate days remaining
  const daysRemaining = subscription.end_date
    ? Math.ceil((new Date(subscription.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  const isLowSessions = remainingSessions <= 2 && remainingSessions > 0;
  const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
  const hasOutstandingBalance = balanceInfo.balance > 0;

  const handlePauseResume = async () => {
    if (subscription.status === 'active') {
      await pauseSubscriptionMutation.mutateAsync({
        subscriptionId: subscription.id,
        reason: 'Paused by admin'
      });
    } else if (subscription.status === 'paused') {
      await resumeSubscriptionMutation.mutateAsync(subscription.id);
    }
  };

  const getStatusBadge = () => {
    switch (subscription.status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'paused':
        return <Badge variant="secondary">Paused</Badge>;
      case 'completed':
        return <Badge variant="outline">Completed</Badge>;
      default:
        return <Badge variant="outline">{subscription.status}</Badge>;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {subscription.plan_name_snapshot}
              {getStatusBadge()}
            </CardTitle>
            <div className="flex gap-2">
              {subscription.status === 'active' && (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePauseResume}
                          disabled={pauseSubscriptionMutation.isPending}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Pause Subscription</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowUpgradeDialog(true)}
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Upgrade Plan</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}

              {subscription.status === 'paused' && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePauseResume}
                        disabled={resumeSubscriptionMutation.isPending}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Resume Subscription</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {hasOutstandingBalance && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPaymentDialog(true)}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Add Payment
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Alerts */}
          <div className="space-y-2">
            {isLowSessions && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Only {remainingSessions} session{remainingSessions !== 1 ? 's' : ''} remaining. Consider renewing soon.
                </AlertDescription>
              </Alert>
            )}

            {isExpiringSoon && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Subscription expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}.
                </AlertDescription>
              </Alert>
            )}

            {hasOutstandingBalance && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Outstanding balance: ${balanceInfo.balance.toFixed(2)}
                  <Button
                    variant="link"
                    className="ml-2 h-auto p-0"
                    onClick={() => setShowPaymentDialog(true)}
                  >
                    Add Payment
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Sessions Progress */}
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sessions Used</span>
              <span className="font-medium">
                {subscription.used_sessions} / {subscription.total_sessions_snapshot}
              </span>
            </div>

            <Progress value={sessionProgress} className="h-2" />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className="text-2xl font-bold">{remainingSessions}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Expires</p>
                <p className="text-sm font-medium">
                  {subscription.end_date ? format(new Date(subscription.end_date), 'PP') : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="font-bold">${subscription.total_amount_snapshot.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Amount Paid</p>
                <p className="font-bold text-green-600">
                  ${subscription.paid_amount.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Payment Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Progress</span>
                <span className="font-medium">
                  {balanceInfo.paidPercentage.toFixed(0)}%
                </span>
              </div>
              <Progress value={balanceInfo.paidPercentage} className="h-1" />
            </div>
          </div>

          {/* Subscription Dates */}
          <div className="flex items-center gap-4 pt-4 border-t text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Started: {format(new Date(subscription.start_date), 'PP')}</span>
            </div>
            {subscription.end_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Expires: {format(new Date(subscription.end_date), 'PP')}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <UpgradeDialog
        currentSubscription={subscription}
        member={member}
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
      />

      <AddPaymentDialog
        subscription={subscription}
        member={member}
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
      />
    </>
  );
}
```

### 4.3 Subscription History Table

**src/features/members/components/SubscriptionHistoryTable.tsx**

```typescript
'use client';

import React from 'react';
import { format } from 'date-fns';
import { MoreHorizontal, Calendar, CreditCard } from 'lucide-react';

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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

import type { MemberSubscriptionWithSnapshot } from '@/features/database/lib/types';

interface SubscriptionHistoryTableProps {
  subscriptions: MemberSubscriptionWithSnapshot[];
  isLoading?: boolean;
}

export function SubscriptionHistoryTable({ subscriptions, isLoading }: SubscriptionHistoryTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      paused: 'secondary',
      completed: 'outline',
      cancelled: 'destructive',
      expired: 'destructive',
    } as const;

    const variant = variants[status as keyof typeof variants] || 'outline';
    return <Badge variant={variant}>{status}</Badge>;
  };

  const calculateProgress = (subscription: MemberSubscriptionWithSnapshot) => {
    return (subscription.used_sessions / subscription.total_sessions_snapshot) * 100;
  };

  const calculatePaymentProgress = (subscription: MemberSubscriptionWithSnapshot) => {
    return (subscription.paid_amount / subscription.total_amount_snapshot) * 100;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{subscription.plan_name_snapshot}</p>
                      <p className="text-sm text-muted-foreground">
                        ${subscription.total_amount_snapshot.toFixed(2)}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(subscription.start_date), 'MMM dd, yyyy')}</span>
                      </div>
                      {subscription.end_date && (
                        <div className="text-xs text-muted-foreground">
                          to {format(new Date(subscription.end_date), 'MMM dd, yyyy')}
                        </div>
                      )}
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
                          Balance: ${(subscription.total_amount_snapshot - subscription.paid_amount).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    {getStatusBadge(subscription.status)}
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Calendar className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {subscription.status === 'active' && (
                          <DropdownMenuItem>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Add Payment
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 4.4 New Subscription Dialog

**src/features/members/components/NewSubscriptionDialog.tsx**

```typescript
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

import { createSubscriptionSchema } from '@/features/memberships/lib/validation';
import { useSubscriptionPlans, useCreateSubscription } from '@/features/memberships/hooks/use-subscriptions';
import { cn } from '@/lib/utils';
import type { Member, PaymentMethod } from '@/features/database/lib/types';

interface NewSubscriptionDialogProps {
  member: Member;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewSubscriptionDialog({ member, open, onOpenChange }: NewSubscriptionDialogProps) {
  const { data: plans, isLoading: isLoadingPlans } = useSubscriptionPlans();
  const createSubscriptionMutation = useCreateSubscription();

  const form = useForm({
    resolver: zodResolver(createSubscriptionSchema),
    defaultValues: {
      member_id: member.id,
      plan_id: '',
      start_date: new Date().toISOString(),
      initial_payment_amount: 0,
      payment_method: 'cash' as PaymentMethod,
      notes: '',
    },
  });

  const watchedPlanId = form.watch('plan_id');
  const watchedInitialPayment = form.watch('initial_payment_amount');

  const selectedPlan = plans?.find(p => p.id === watchedPlanId);

  const sessionInfo = selectedPlan ? {
    totalSessions: selectedPlan.sessions_count,
    pricePerSession: selectedPlan.price / selectedPlan.sessions_count,
    duration: selectedPlan.duration_days || 30,
  } : null;

  const balanceInfo = selectedPlan ? {
    totalPrice: selectedPlan.price,
    initialPayment: watchedInitialPayment || 0,
    remainingBalance: Math.max(0, selectedPlan.price - (watchedInitialPayment || 0)),
    isFullyPaid: (watchedInitialPayment || 0) >= selectedPlan.price,
  } : null;

  const onSubmit = async (data: any) => {
    try {
      await createSubscriptionMutation.mutateAsync(data);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Subscription</DialogTitle>
          <DialogDescription>
            Create a new subscription for {member.first_name} {member.last_name}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Plan Selection */}
            <FormField
              control={form.control}
              name="plan_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subscription Plan</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingPlans ? (
                        <div className="p-2">
                          <Skeleton className="h-8 w-full" />
                        </div>
                      ) : (
                        plans?.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            <div className="flex justify-between items-center w-full">
                              <span>{plan.name}</span>
                              <span className="ml-4 font-bold">${plan.price}</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Plan Details */}
            {selectedPlan && sessionInfo && (
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Sessions</p>
                      <p className="font-bold">{sessionInfo.totalSessions}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-bold">{sessionInfo.duration} days</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Price</p>
                      <p className="font-bold">${selectedPlan.price.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Per Session</p>
                      <p className="font-bold">${sessionInfo.pricePerSession.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Start Date */}
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(new Date(field.value), 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => field.onChange(date?.toISOString())}
                        disabled={(date) =>
                          date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    When the subscription should start
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Initial Payment */}
            <FormField
              control={form.control}
              name="initial_payment_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Payment</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Amount to collect now (can be partial payment)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Breakdown */}
            {balanceInfo && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Plan Price:</span>
                      <span className="font-medium">${balanceInfo.totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Initial Payment:</span>
                      <span className="font-medium">${balanceInfo.initialPayment.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span>Remaining Balance:</span>
                      <span className={cn(
                        'font-bold',
                        balanceInfo.remainingBalance > 0 ? 'text-orange-600' : 'text-green-600'
                      )}>
                        ${balanceInfo.remainingBalance.toFixed(2)}
                      </span>
                    </div>
                    {balanceInfo.isFullyPaid && (
                      <p className="text-sm text-green-600">✓ Fully paid</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Method */}
            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Credit/Debit Card</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="online">Online Payment</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this subscription..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional notes or special instructions
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={createSubscriptionMutation.isPending || !selectedPlan}
                className="flex-1"
              >
                {createSubscriptionMutation.isPending ? 'Creating...' : 'Create Subscription'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createSubscriptionMutation.isPending}
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

### 4.5 Member Payments Tab Component

**src/features/members/components/MemberPayments.tsx**

```typescript
'use client';

import React from 'react';
import { CreditCard } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

import { useMemberPayments } from '@/features/payments/hooks/use-payments';
import { PaymentHistoryTable } from '@/features/payments/components/PaymentHistoryTable';
import type { Member } from '@/features/database/lib/types';

interface MemberPaymentsProps {
  member: Member;
}

export function MemberPayments({ member }: MemberPaymentsProps) {
  const {
    data: payments,
    isLoading,
    error
  } = useMemberPayments(member.id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
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
      <Card>
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
  const totalRefunded = payments.reduce((sum, payment) => sum + (payment.refund_amount || 0), 0);
  const netPaid = totalPaid - totalRefunded;

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">${totalPaid.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total Paid</p>
          </CardContent>
        </Card>

        {totalRefunded > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">-${totalRefunded.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Total Refunded</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">${netPaid.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Net Paid</p>
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
```

### 4.6 Integration with Member Details Tabs

**src/features/members/components/MemberDetailsWithTabs.tsx** (update existing file)

```typescript
// Add these imports
import { MemberSubscriptions } from './MemberSubscriptions';
import { MemberPayments } from './MemberPayments';

// Update the tabs array to include new tabs
const tabs = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'sessions', label: 'Sessions', icon: Calendar },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard }, // New tab
  { id: 'payments', label: 'Payments', icon: Receipt }, // New tab
] as const;

// Update the tab content rendering
{activeTab === 'subscriptions' && (
  <MemberSubscriptions member={member} />
)}

{activeTab === 'payments' && (
  <MemberPayments member={member} />
)}
```

## Implementation Checklist

### Components

- [ ] Create MemberSubscriptions tab component
- [ ] Build ActiveSubscriptionCard with progress indicators
- [ ] Create SubscriptionHistoryTable with actions
- [ ] Build NewSubscriptionDialog with plan selection
- [ ] Create MemberPayments tab with summary
- [ ] Integrate with existing MemberDetailsWithTabs

### UI/UX Features

- [ ] Add subscription status badges and colors
- [ ] Implement progress bars for sessions and payments
- [ ] Add tooltips for action buttons
- [ ] Create alert components for warnings
- [ ] Add loading states and skeletons
- [ ] Implement empty states with actions

### Dialogs and Modals

- [ ] Build UpgradeDialog (referenced but not detailed here)
- [ ] Create AddPaymentDialog (referenced but not detailed here)
- [ ] Add confirmation dialogs for destructive actions
- [ ] Test dialog state management

### Mobile Responsiveness

- [ ] Test all components on mobile devices
- [ ] Adjust table layouts for small screens
- [ ] Optimize touch interactions
- [ ] Test accessibility features

### Testing

- [ ] Test component rendering with different data states
- [ ] Test user interactions and form submissions
- [ ] Test error states and loading states
- [ ] Test accessibility compliance
- [ ] Integration tests with real data

## Success Criteria

1. All subscription information displays correctly
2. Progress indicators accurately reflect usage
3. Actions (pause, upgrade, payment) work seamlessly
4. Forms validate and submit correctly
5. Responsive design works on all screen sizes
6. Loading and error states provide good UX
7. Components follow existing design patterns
8. Accessibility standards are met
