"use client";

import React, { useState } from "react";
import { Plus, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

import {
  useActiveSubscription,
  useMemberSubscriptionHistory,
} from "@/features/memberships/hooks/use-subscriptions";
import type { Member } from "@/features/database/lib/types";

import { ActiveSubscriptionCard } from "./ActiveSubscriptionCard";
import { SubscriptionHistoryTable } from "./SubscriptionHistoryTable";
import { NewSubscriptionDialog } from "./NewSubscriptionDialog";

interface MemberSubscriptionsProps {
  member: Member;
}

export function MemberSubscriptions({ member }: MemberSubscriptionsProps) {
  const [showNewSubscriptionDialog, setShowNewSubscriptionDialog] =
    useState(false);

  const {
    data: activeSubscription,
    isLoading: isLoadingActive,
    error: activeError,
  } = useActiveSubscription(member?.id);

  const {
    data: subscriptionHistory,
    isLoading: isLoadingHistory,
    error: historyError,
  } = useMemberSubscriptionHistory(member?.id);

  if (!member) {
    return <div>No member data available</div>;
  }

  if (isLoadingActive && isLoadingHistory) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[200px] w-full" data-testid="skeleton" />
        <Skeleton className="h-[300px] w-full" data-testid="skeleton" />
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
