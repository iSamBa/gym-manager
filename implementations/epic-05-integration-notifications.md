# Epic 5: Integration & Notifications

## Overview

Integrate subscriptions with training sessions and implement smart notifications system for session credit validation, payment reminders, and subscription alerts.

## Technical Requirements

### 5.1 Training Session Integration

**src/features/training-sessions/hooks/use-session-booking-with-credits.ts**

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { subscriptionUtils } from "@/features/memberships/lib/subscription-utils";
import { useActiveSubscription } from "@/features/memberships/hooks/use-subscriptions";
import { useConsumeSession } from "@/features/memberships/hooks/use-subscriptions";
import { notificationUtils } from "@/features/memberships/lib/notification-utils";
import { toast } from "sonner";

interface SessionBookingInput {
  memberId: string;
  trainerId: string;
  sessionDate: string;
  sessionTime: string;
  sessionType:
    | "personal_training"
    | "small_group"
    | "consultation"
    | "assessment";
  notes?: string;
}

/**
 * Enhanced session booking that validates subscription credits
 */
export function useSessionBookingWithCredits() {
  const queryClient = useQueryClient();
  const consumeSessionMutation = useConsumeSession();

  return useMutation({
    mutationFn: async (input: SessionBookingInput) => {
      // Step 1: Check for active subscription
      const subscription = await subscriptionUtils.getSubscriptionWithDetails(
        await subscriptionUtils
          .getMemberActiveSubscription(input.memberId)
          .then((sub) => sub?.id)
      );

      if (!subscription) {
        throw new Error(
          "No active subscription found. Please create a subscription first."
        );
      }

      // Step 2: Validate subscription status
      if (subscription.status !== "active") {
        throw new Error(
          `Cannot book session. Subscription is ${subscription.status}.`
        );
      }

      // Step 3: Check remaining sessions
      if (subscription.remaining_sessions <= 0) {
        throw new Error(
          "No sessions remaining in current subscription. Please renew or upgrade."
        );
      }

      // Step 4: Check for outstanding payments
      const hasOutstandingBalance = subscription.balance_due > 0;

      if (hasOutstandingBalance) {
        // Send notification but allow booking (as per requirements)
        await notificationUtils.sendPaymentAlert({
          memberId: input.memberId,
          trainerId: input.trainerId,
          subscriptionId: subscription.id,
          balance: subscription.balance_due,
          sessionDate: input.sessionDate,
        });

        // Show warning toast
        toast.warning("Outstanding Balance", {
          description: `Member has outstanding balance of $${subscription.balance_due.toFixed(2)}. Admin/trainer notified.`,
          duration: 8000,
        });
      }

      // Step 5: Create the training session booking
      const booking = await createTrainingSessionBooking({
        member_id: input.memberId,
        trainer_id: input.trainerId,
        session_date: input.sessionDate,
        session_time: input.sessionTime,
        session_type: input.sessionType,
        subscription_id: subscription.id,
        notes: input.notes,
      });

      // Step 6: Consume session credit
      await consumeSessionMutation.mutateAsync(subscription.id);

      // Step 7: Check for low sessions warning
      const remainingAfterBooking = subscription.remaining_sessions - 1;
      if (remainingAfterBooking <= 2 && remainingAfterBooking > 0) {
        toast.warning("Low Sessions Remaining", {
          description: `Only ${remainingAfterBooking} session(s) remaining. Consider renewing soon.`,
          action: {
            label: "Renew",
            onClick: () => {
              // Navigate to renewal flow
              window.location.href = `/members/${input.memberId}/subscriptions/new`;
            },
          },
        });
      }

      // Step 8: Handle subscription completion
      if (remainingAfterBooking === 0) {
        toast.info("Subscription Completed", {
          description:
            "All sessions have been used. Please create a new subscription.",
          action: {
            label: "New Subscription",
            onClick: () => {
              window.location.href = `/members/${input.memberId}/subscriptions/new`;
            },
          },
        });
      }

      return booking;
    },

    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ["training-sessions"],
      });
      queryClient.invalidateQueries({
        queryKey: ["subscriptions", "member", variables.memberId],
      });

      toast.success("Session Booked", {
        description:
          "Training session has been successfully booked and session credit consumed.",
      });
    },

    onError: (error) => {
      toast.error("Booking Failed", {
        description:
          error instanceof Error ? error.message : "Failed to book session",
        duration: 8000,
      });
    },
  });
}

// Helper function to create training session booking
async function createTrainingSessionBooking(data: any) {
  // This would integrate with your existing training session creation logic
  // Implementation depends on your current training session structure
  const { data: booking, error } = await supabase
    .from("trainer_sessions")
    .insert({
      member_id: data.member_id,
      trainer_id: data.trainer_id,
      session_date: data.session_date,
      start_time: data.session_time,
      session_type: data.session_type,
      subscription_id: data.subscription_id,
      status: "scheduled",
      notes: data.notes,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return booking;
}
```

### 5.2 Notification System

**src/features/memberships/lib/notification-utils.ts**

```typescript
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type {
  MemberSubscriptionWithSnapshot,
  Member,
} from "@/features/database/lib/types";

export interface PaymentAlertInput {
  memberId: string;
  trainerId: string;
  subscriptionId: string;
  balance: number;
  sessionDate: string;
}

export interface RenewalReminderInput {
  memberId: string;
  subscriptionId: string;
  remainingSessions: number;
  daysUntilExpiry: number;
}

export interface ExpiryAlertInput {
  memberId: string;
  subscriptionId: string;
  expiryDate: string;
}

export const notificationUtils = {
  /**
   * Send payment alert to admin/trainer when member books with outstanding balance
   */
  async sendPaymentAlert(input: PaymentAlertInput) {
    // Create notification record
    const notification = {
      type: "payment_alert",
      member_id: input.memberId,
      trainer_id: input.trainerId,
      subscription_id: input.subscriptionId,
      title: "Outstanding Balance Alert",
      message: `Member has an outstanding balance of $${input.balance.toFixed(2)} for session on ${input.sessionDate}`,
      metadata: {
        balance: input.balance,
        sessionDate: input.sessionDate,
        severity: "warning",
      },
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("notifications").insert(notification);

    if (error) {
      console.error("Failed to create payment alert:", error);
    }

    // Send real-time notification to trainer
    await this.sendRealtimeNotification(input.trainerId, {
      type: "payment_alert",
      title: "Outstanding Balance",
      message: `Member booking session has outstanding balance: $${input.balance.toFixed(2)}`,
      priority: "medium",
    });
  },

  /**
   * Check for low sessions and send renewal reminders
   */
  async checkLowSessions(subscription: MemberSubscriptionWithSnapshot) {
    const remainingSessions = subscription.remaining_sessions || 0;

    // Client-side toast for immediate feedback
    if (remainingSessions <= 2 && remainingSessions > 0) {
      toast.warning("Low Sessions", {
        description: `Only ${remainingSessions} session(s) remaining in your subscription`,
        action: {
          label: "Renew Now",
          onClick: () => {
            window.location.href = `/members/${subscription.member_id}/subscriptions/new`;
          },
        },
      });
    }

    if (remainingSessions === 0) {
      toast.error("No Sessions Remaining", {
        description: "Please renew your subscription to book more sessions",
        action: {
          label: "Renew",
          onClick: () => {
            window.location.href = `/members/${subscription.member_id}/subscriptions/new`;
          },
        },
      });
    }

    // Server-side notification for tracking
    if (remainingSessions <= 2) {
      await this.createRenewalReminder({
        memberId: subscription.member_id,
        subscriptionId: subscription.id,
        remainingSessions,
        daysUntilExpiry: subscription.days_remaining || 0,
      });
    }
  },

  /**
   * Create renewal reminder notification
   */
  async createRenewalReminder(input: RenewalReminderInput) {
    const { error } = await supabase.from("notifications").insert({
      type: "renewal_reminder",
      member_id: input.memberId,
      subscription_id: input.subscriptionId,
      title: "Subscription Renewal Reminder",
      message: `${input.remainingSessions} session(s) remaining. Consider renewing soon.`,
      metadata: {
        remainingSessions: input.remainingSessions,
        daysUntilExpiry: input.daysUntilExpiry,
        severity: input.remainingSessions === 0 ? "high" : "medium",
      },
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Failed to create renewal reminder:", error);
    }
  },

  /**
   * Check for expiring subscriptions and send alerts
   */
  async checkExpiryDates() {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const { data: expiringSubscriptions, error } = await supabase
      .from("member_subscriptions")
      .select(
        `
        *,
        members!inner(first_name, last_name, email)
      `
      )
      .eq("status", "active")
      .lte("end_date", sevenDaysFromNow.toISOString())
      .gt("end_date", new Date().toISOString());

    if (error) {
      console.error("Failed to fetch expiring subscriptions:", error);
      return;
    }

    for (const subscription of expiringSubscriptions) {
      const daysRemaining = Math.ceil(
        (new Date(subscription.end_date).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      );

      await this.createExpiryAlert({
        memberId: subscription.member_id,
        subscriptionId: subscription.id,
        expiryDate: subscription.end_date,
      });

      // Show admin notification
      toast.info("Subscription Expiring Soon", {
        description: `${subscription.members.first_name} ${subscription.members.last_name}'s subscription expires in ${daysRemaining} days`,
      });
    }
  },

  /**
   * Create expiry alert notification
   */
  async createExpiryAlert(input: ExpiryAlertInput) {
    const daysRemaining = Math.ceil(
      (new Date(input.expiryDate).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
    );

    const { error } = await supabase.from("notifications").insert({
      type: "expiry_alert",
      member_id: input.memberId,
      subscription_id: input.subscriptionId,
      title: "Subscription Expiring Soon",
      message: `Subscription expires in ${daysRemaining} day(s) on ${new Date(input.expiryDate).toLocaleDateString()}`,
      metadata: {
        expiryDate: input.expiryDate,
        daysRemaining,
        severity: daysRemaining <= 3 ? "high" : "medium",
      },
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Failed to create expiry alert:", error);
    }
  },

  /**
   * Send real-time notification via Supabase realtime
   */
  async sendRealtimeNotification(
    userId: string,
    notification: {
      type: string;
      title: string;
      message: string;
      priority: "low" | "medium" | "high";
    }
  ) {
    const { error } = await supabase.from("realtime_notifications").insert({
      user_id: userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      read: false,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Failed to send realtime notification:", error);
    }
  },

  /**
   * Get payment statistics for notifications
   */
  async getPaymentStatistics() {
    const { data: outstandingBalances, error } = await supabase
      .from("member_subscriptions")
      .select(
        `
        id,
        member_id,
        total_amount_snapshot,
        paid_amount,
        members!inner(first_name, last_name)
      `
      )
      .eq("status", "active")
      .gt("total_amount_snapshot", "paid_amount");

    if (error) {
      console.error("Failed to fetch payment statistics:", error);
      return null;
    }

    const totalOutstanding = outstandingBalances.reduce(
      (sum, sub) => sum + (sub.total_amount_snapshot - sub.paid_amount),
      0
    );

    return {
      membersWithOutstandingBalance: outstandingBalances.length,
      totalOutstandingAmount: totalOutstanding,
      outstandingBalances: outstandingBalances.map((sub) => ({
        memberId: sub.member_id,
        memberName: `${sub.members.first_name} ${sub.members.last_name}`,
        balance: sub.total_amount_snapshot - sub.paid_amount,
      })),
    };
  },

  /**
   * Get session usage statistics
   */
  async getSessionStatistics() {
    const { data: subscriptions, error } = await supabase
      .from("member_subscriptions")
      .select("total_sessions_snapshot, used_sessions")
      .eq("status", "active");

    if (error) {
      console.error("Failed to fetch session statistics:", error);
      return null;
    }

    const totalSessions = subscriptions.reduce(
      (sum, sub) => sum + sub.total_sessions_snapshot,
      0
    );
    const usedSessions = subscriptions.reduce(
      (sum, sub) => sum + sub.used_sessions,
      0
    );
    const utilizationRate =
      totalSessions > 0 ? (usedSessions / totalSessions) * 100 : 0;

    const lowSessionSubscriptions = subscriptions.filter(
      (sub) => sub.total_sessions_snapshot - sub.used_sessions <= 2
    );

    return {
      totalSessions,
      usedSessions,
      remainingSessions: totalSessions - usedSessions,
      utilizationRate,
      subscriptionsWithLowSessions: lowSessionSubscriptions.length,
    };
  },
};
```

### 5.3 Dashboard Alert Components

**src/features/memberships/components/SubscriptionAlerts.tsx**

```typescript
'use client';

import React from 'react';
import { AlertCircle, DollarSign, Calendar, Users } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import { useQuery } from '@tanstack/react-query';
import { notificationUtils } from '../lib/notification-utils';

interface AlertItem {
  id: string;
  type: 'payment' | 'renewal' | 'expiry' | 'low_sessions';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  memberName?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function SubscriptionAlerts() {
  const { data: paymentStats, isLoading: isLoadingPayments } = useQuery({
    queryKey: ['subscription-alerts', 'payments'],
    queryFn: () => notificationUtils.getPaymentStatistics(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const { data: sessionStats, isLoading: isLoadingSessions } = useQuery({
    queryKey: ['subscription-alerts', 'sessions'],
    queryFn: () => notificationUtils.getSessionStatistics(),
    staleTime: 2 * 60 * 1000,
  });

  if (isLoadingPayments && isLoadingSessions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const alerts: AlertItem[] = [];

  // Payment alerts
  if (paymentStats && paymentStats.membersWithOutstandingBalance > 0) {
    alerts.push({
      id: 'outstanding-payments',
      type: 'payment',
      title: 'Outstanding Payments',
      message: `${paymentStats.membersWithOutstandingBalance} member(s) have outstanding balances totaling $${paymentStats.totalOutstandingAmount.toFixed(2)}`,
      severity: paymentStats.totalOutstandingAmount > 1000 ? 'high' : 'medium',
      action: {
        label: 'View Details',
        onClick: () => {
          window.location.href = '/payments?filter=outstanding';
        },
      },
    });
  }

  // Low sessions alerts
  if (sessionStats && sessionStats.subscriptionsWithLowSessions > 0) {
    alerts.push({
      id: 'low-sessions',
      type: 'low_sessions',
      title: 'Low Session Credits',
      message: `${sessionStats.subscriptionsWithLowSessions} subscription(s) have 2 or fewer sessions remaining`,
      severity: 'medium',
      action: {
        label: 'View Members',
        onClick: () => {
          window.location.href = '/subscriptions?filter=low-sessions';
        },
      },
    });
  }

  // Utilization alert
  if (sessionStats && sessionStats.utilizationRate < 50) {
    alerts.push({
      id: 'low-utilization',
      type: 'renewal',
      title: 'Low Session Utilization',
      message: `Overall session utilization is ${sessionStats.utilizationRate.toFixed(1)}%. Consider engagement strategies.`,
      severity: 'low',
    });
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <AlertCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <p className="text-sm text-muted-foreground">All good! No alerts at this time.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getAlertIcon = (type: AlertItem['type']) => {
    switch (type) {
      case 'payment':
        return <DollarSign className="h-4 w-4" />;
      case 'renewal':
      case 'expiry':
        return <Calendar className="h-4 w-4" />;
      case 'low_sessions':
        return <Users className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getAlertVariant = (severity: AlertItem['severity']) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const getSeverityBadge = (severity: AlertItem['severity']) => {
    const variants = {
      high: 'destructive',
      medium: 'default',
      low: 'secondary',
    } as const;

    return (
      <Badge variant={variants[severity]} className="text-xs">
        {severity.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Subscription Alerts
          <Badge variant="outline">{alerts.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <Alert key={alert.id} variant={getAlertVariant(alert.severity)}>
            <div className="flex items-start gap-3">
              {getAlertIcon(alert.type)}
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <AlertTitle className="text-sm font-medium">
                    {alert.title}
                  </AlertTitle>
                  {getSeverityBadge(alert.severity)}
                </div>
                <AlertDescription className="text-sm">
                  {alert.message}
                </AlertDescription>
              </div>
            </div>
            {alert.action && (
              <div className="mt-3 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={alert.action.onClick}
                >
                  {alert.action.label}
                </Button>
              </div>
            )}
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}
```

### 5.4 Payment Due Widget

**src/features/memberships/components/PaymentDueWidget.tsx**

```typescript
'use client';

import React from 'react';
import { DollarSign, ArrowRight } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

import { useQuery } from '@tanstack/react-query';
import { notificationUtils } from '../lib/notification-utils';

export function PaymentDueWidget() {
  const { data: paymentStats, isLoading } = useQuery({
    queryKey: ['payment-due-widget'],
    queryFn: () => notificationUtils.getPaymentStatistics(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Due
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!paymentStats || paymentStats.membersWithOutstandingBalance === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Due
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={DollarSign}
            title="All Caught Up!"
            description="No outstanding payments at this time."
            compact
          />
        </CardContent>
      </Card>
    );
  }

  const topOutstandingBalances = paymentStats.outstandingBalances
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Due
          </div>
          <Badge variant="destructive">
            {paymentStats.membersWithOutstandingBalance}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="rounded-lg bg-red-50 p-3">
          <div className="text-2xl font-bold text-red-900">
            ${paymentStats.totalOutstandingAmount.toFixed(2)}
          </div>
          <p className="text-sm text-red-700">Total Outstanding</p>
        </div>

        {/* Top Outstanding Balances */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Top Outstanding Balances</h4>
          {topOutstandingBalances.map((member, index) => (
            <div
              key={member.memberId}
              className="flex items-center justify-between p-2 rounded border"
            >
              <div className="flex-1">
                <p className="font-medium text-sm">{member.memberName}</p>
                <p className="text-xs text-muted-foreground">
                  Member #{member.memberId.slice(-8)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-red-600">
                  ${member.balance.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            window.location.href = '/payments?filter=outstanding';
          }}
        >
          View All Outstanding Payments
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
```

### 5.5 Session Credit Validator Hook

**src/features/training-sessions/hooks/use-session-credit-validator.ts**

```typescript
import { useQuery } from "@tanstack/react-query";
import { subscriptionUtils } from "@/features/memberships/lib/subscription-utils";
import type { MemberSubscriptionWithSnapshot } from "@/features/database/lib/types";

interface SessionCreditValidation {
  canBook: boolean;
  subscription: MemberSubscriptionWithSnapshot | null;
  warnings: string[];
  errors: string[];
  remainingSessions: number;
  hasOutstandingBalance: boolean;
  balanceAmount: number;
}

/**
 * Validates if a member can book a session based on their subscription credits
 */
export function useSessionCreditValidator(memberId: string) {
  return useQuery({
    queryKey: ["session-credit-validation", memberId],
    queryFn: async (): Promise<SessionCreditValidation> => {
      if (!memberId) {
        return {
          canBook: false,
          subscription: null,
          warnings: [],
          errors: ["No member selected"],
          remainingSessions: 0,
          hasOutstandingBalance: false,
          balanceAmount: 0,
        };
      }

      try {
        // Get active subscription
        const activeSubscription =
          await subscriptionUtils.getMemberActiveSubscription(memberId);

        if (!activeSubscription) {
          return {
            canBook: false,
            subscription: null,
            warnings: [],
            errors: ["No active subscription found"],
            remainingSessions: 0,
            hasOutstandingBalance: false,
            balanceAmount: 0,
          };
        }

        // Get subscription with computed details
        const subscription = await subscriptionUtils.getSubscriptionWithDetails(
          activeSubscription.id
        );

        const warnings: string[] = [];
        const errors: string[] = [];

        // Check subscription status
        if (subscription.status !== "active") {
          errors.push(`Subscription is ${subscription.status}`);
        }

        // Check remaining sessions
        const remainingSessions = subscription.remaining_sessions || 0;
        if (remainingSessions <= 0) {
          errors.push("No sessions remaining in subscription");
        } else if (remainingSessions <= 2) {
          warnings.push(
            `Only ${remainingSessions} session(s) remaining. Consider renewing soon.`
          );
        }

        // Check outstanding balance
        const balanceAmount = subscription.balance_due || 0;
        const hasOutstandingBalance = balanceAmount > 0;
        if (hasOutstandingBalance) {
          warnings.push(
            `Outstanding balance: $${balanceAmount.toFixed(2)}. Admin/trainer will be notified.`
          );
        }

        // Check expiry date
        if (
          subscription.days_remaining !== undefined &&
          subscription.days_remaining <= 7
        ) {
          if (subscription.days_remaining <= 0) {
            errors.push("Subscription has expired");
          } else {
            warnings.push(
              `Subscription expires in ${subscription.days_remaining} day(s)`
            );
          }
        }

        const canBook = errors.length === 0;

        return {
          canBook,
          subscription,
          warnings,
          errors,
          remainingSessions,
          hasOutstandingBalance,
          balanceAmount,
        };
      } catch (error) {
        return {
          canBook: false,
          subscription: null,
          warnings: [],
          errors: [
            error instanceof Error
              ? error.message
              : "Failed to validate session credits",
          ],
          remainingSessions: 0,
          hasOutstandingBalance: false,
          balanceAmount: 0,
        };
      }
    },
    enabled: !!memberId,
    staleTime: 30 * 1000, // 30 seconds - real-time validation
  });
}
```

### 5.6 Integration with Existing Training Session Form

**src/features/training-sessions/components/SessionBookingForm.tsx** (enhancement)

```typescript
// Add to existing imports
import { useSessionCreditValidator } from '../hooks/use-session-credit-validator';
import { useSessionBookingWithCredits } from '../hooks/use-session-booking-with-credits';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle } from 'lucide-react';

// Add to existing SessionBookingForm component
export function SessionBookingForm({ onSuccess }: SessionBookingFormProps) {
  const [selectedMemberId, setSelectedMemberId] = useState('');

  // Add credit validation
  const {
    data: creditValidation,
    isLoading: isValidatingCredits
  } = useSessionCreditValidator(selectedMemberId);

  // Use enhanced booking mutation
  const bookSessionMutation = useSessionBookingWithCredits();

  // ... existing form logic

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Existing member selection field */}
        <FormField
          control={form.control}
          name="memberId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Member</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  setSelectedMemberId(value);
                }}
                defaultValue={field.value}
              >
                {/* ... existing member selection options */}
              </Select>
            </FormItem>
          )}
        />

        {/* Credit Validation Alerts */}
        {selectedMemberId && !isValidatingCredits && creditValidation && (
          <div className="space-y-2">
            {/* Error alerts */}
            {creditValidation.errors.map((error, index) => (
              <Alert key={`error-${index}`} variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ))}

            {/* Warning alerts */}
            {creditValidation.warnings.map((warning, index) => (
              <Alert key={`warning-${index}`}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{warning}</AlertDescription>
              </Alert>
            ))}

            {/* Success state */}
            {creditValidation.canBook && creditValidation.warnings.length === 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  ✓ {creditValidation.remainingSessions} session(s) available
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Existing form fields */}
        {/* ... trainer, date, time, etc. */}

        {/* Submit button with validation */}
        <Button
          type="submit"
          disabled={
            bookSessionMutation.isPending ||
            isValidatingCredits ||
            (creditValidation && !creditValidation.canBook)
          }
          className="w-full"
        >
          {bookSessionMutation.isPending
            ? 'Booking Session...'
            : creditValidation && !creditValidation.canBook
            ? 'Cannot Book Session'
            : 'Book Session'
          }
        </Button>
      </form>
    </Form>
  );
}
```

## Implementation Checklist

### Integration Tasks

- [ ] Create session booking with credit validation hook
- [ ] Integrate with existing training session booking system
- [ ] Add credit consumption to session booking flow
- [ ] Test session credit validation logic
- [ ] Handle subscription status changes during booking

### Notification System

- [ ] Build notification utilities for all alert types
- [ ] Create payment alert system for outstanding balances
- [ ] Add low session and renewal reminders
- [ ] Implement expiry date monitoring
- [ ] Create real-time notification system

### Dashboard Components

- [ ] Build SubscriptionAlerts widget
- [ ] Create PaymentDueWidget for outstanding balances
- [ ] Add session utilization statistics
- [ ] Create alert action buttons and navigation
- [ ] Test widget refresh and real-time updates

### Session Credit Validation

- [ ] Create session credit validator hook
- [ ] Add real-time validation to booking forms
- [ ] Build warning and error display components
- [ ] Test edge cases and boundary conditions
- [ ] Add proper error handling and recovery

### Testing

- [ ] Unit tests for notification utilities
- [ ] Integration tests for session booking flow
- [ ] Test alert generation and display
- [ ] Test credit validation scenarios
- [ ] Test real-time notification delivery

## Success Criteria

1. Session booking validates subscription credits correctly
2. Outstanding balance alerts are sent to appropriate users
3. Low session warnings appear at the right thresholds
4. Dashboard widgets display accurate alert information
5. Real-time notifications work properly
6. Session credit consumption integrates seamlessly
7. Error handling provides clear user feedback
8. Performance remains good with notification checks
