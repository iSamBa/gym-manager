"use client";

import React, { useState } from "react";
import { Plus, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { useMemberWithSubscription } from "@/features/members/hooks";
import { useMemberSubscriptionHistory } from "@/features/memberships/hooks/use-subscriptions";
import type { Member } from "@/features/database/lib/types";

import { MemberSubscriptionTable } from "./MemberSubscriptionTable";
import { NewSubscriptionDialog } from "./NewSubscriptionDialog";

interface MemberSubscriptionsProps {
  member: Member;
}

export function MemberSubscriptions({ member }: MemberSubscriptionsProps) {
  const [showNewSubscriptionDialog, setShowNewSubscriptionDialog] =
    useState(false);

  const { isLoading: memberLoading } = useMemberWithSubscription(member?.id);

  // Fetch member's subscription history
  const {
    data: subscriptions = [],
    isLoading: subscriptionsLoading,
    error,
  } = useMemberSubscriptionHistory(member?.id);

  const isLoading = memberLoading || subscriptionsLoading;

  if (!member) {
    return <div>No member data available</div>;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[400px] w-full" data-testid="skeleton" />
      </div>
    );
  }

  if (error) {
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
      {/* Header with New Subscription Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Subscriptions</h3>
        <Button onClick={() => setShowNewSubscriptionDialog(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New Subscription
        </Button>
      </div>

      {/* Unified Subscription Table */}
      <MemberSubscriptionTable
        subscriptions={subscriptions}
        isLoading={isLoading}
        error={error}
      />

      {/* New Subscription Dialog */}
      <NewSubscriptionDialog
        member={member}
        open={showNewSubscriptionDialog}
        onOpenChange={setShowNewSubscriptionDialog}
      />
    </div>
  );
}
