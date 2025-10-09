"use client";

import { useState, memo } from "react";
import { DollarSign, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PaymentForm } from "@/features/payments/components/PaymentForm";
import { useMemberSubscriptionHistory } from "@/features/memberships/hooks/use-subscriptions";
import type { Member } from "@/features/database/lib/types";

interface AddPaymentButtonProps {
  member: Member;
  onSuccess?: () => void;
  variant?: "ghost" | "outline" | "default";
  size?: "sm" | "default" | "lg" | "icon";
  className?: string;
  showText?: boolean;
}

/**
 * AddPaymentButton - Quick action to record a payment for a member
 *
 * Opens a dialog with the payment form for the member's active subscription.
 */
export const AddPaymentButton = memo(function AddPaymentButton({
  member,
  onSuccess,
  variant = "ghost",
  size = "sm",
  className,
  showText = false,
}: AddPaymentButtonProps) {
  const [open, setOpen] = useState(false);

  // Fetch member's subscriptions when dialog opens
  const { data: subscriptions = [], isLoading } = useMemberSubscriptionHistory(
    member.id
  );

  const handleSuccess = () => {
    setOpen(false);
    onSuccess?.();
  };

  const handleCancel = () => {
    setOpen(false);
  };

  // Find active subscription
  const activeSubscription = subscriptions.find(
    (sub) => sub.status === "active"
  );

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        title="Add Payment"
      >
        <DollarSign className={showText ? "mr-2 h-4 w-4" : "h-4 w-4"} />
        {showText && "Record Payment"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              Add Payment for {member.first_name} {member.last_name}
            </DialogTitle>
            <DialogDescription>
              Record a new payment from this member
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading subscription...</span>
            </div>
          ) : activeSubscription ? (
            <PaymentForm
              subscription={activeSubscription}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          ) : (
            <div className="py-4">
              <Alert>
                <AlertDescription>
                  This member does not have an active subscription. Please
                  create a subscription first before recording a payment.
                </AlertDescription>
              </Alert>
              <div className="mt-4 flex justify-end">
                <Button variant="outline" onClick={handleCancel}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
});
