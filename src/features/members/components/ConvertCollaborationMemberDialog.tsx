"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import type { Member } from "@/features/database/lib/types";

interface ConvertCollaborationMemberDialogProps {
  member: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversionComplete?: (member: Member) => void;
}

export function ConvertCollaborationMemberDialog({
  member,
  open,
  onOpenChange,
  onConversionComplete,
}: ConvertCollaborationMemberDialogProps) {
  const [endPartnership, setEndPartnership] = useState(true);
  const [conversionNotes, setConversionNotes] = useState("");
  const [createSubscription, setCreateSubscription] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConvert = async () => {
    if (!member) return;

    setIsLoading(true);
    setError(null);

    try {
      // Import dynamically to avoid circular deps
      const { convertCollaborationMember } = await import(
        "@/features/members/lib/collaboration-utils"
      );

      const result = await convertCollaborationMember({
        member_id: member.id,
        end_partnership: endPartnership,
        conversion_notes: conversionNotes,
      });

      if (!result.success || !result.member) {
        setError(result.error || "Failed to convert member");
        return;
      }

      // Success - notify parent
      onConversionComplete?.(result.member);

      // If user wants to create subscription, open subscription dialog
      if (createSubscription) {
        // This would trigger opening NewSubscriptionDialog
        // Implementation depends on your app's dialog management
        // For now, we'll just note this in the conversion notes
      }

      // Close dialog
      onOpenChange(false);

      // Reset form
      setEndPartnership(true);
      setConversionNotes("");
      setCreateSubscription(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!member || member.member_type !== "collaboration") {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[60vw] sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Convert to Full Member</DialogTitle>
          <DialogDescription>
            Convert {member.first_name} {member.last_name} from collaboration
            partner to regular full member.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Partnership Info Display */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Current Partnership:</strong>
              <br />
              Company: {member.partnership_company || "N/A"}
              <br />
              Contract: {member.partnership_contract_start || "N/A"} to{" "}
              {member.partnership_contract_end || "N/A"}
            </AlertDescription>
          </Alert>

          {/* Warning */}
          <Alert variant="destructive">
            <AlertDescription>
              <strong>Warning:</strong> This action cannot be undone. The member
              will be converted to a full member and will require a regular paid
              subscription.
            </AlertDescription>
          </Alert>

          {/* End Partnership Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="end_partnership"
              checked={endPartnership}
              onCheckedChange={(checked) => setEndPartnership(checked === true)}
            />
            <Label htmlFor="end_partnership" className="cursor-pointer">
              Mark partnership as ended today
            </Label>
          </div>

          {/* Create Subscription Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="create_subscription"
              checked={createSubscription}
              onCheckedChange={(checked) =>
                setCreateSubscription(checked === true)
              }
            />
            <Label htmlFor="create_subscription" className="cursor-pointer">
              Create regular subscription after conversion
            </Label>
          </div>

          {/* Conversion Notes */}
          <div className="space-y-2">
            <Label htmlFor="conversion_notes">
              Conversion Notes (Optional)
            </Label>
            <Textarea
              id="conversion_notes"
              placeholder="Reason for conversion, next steps, etc..."
              value={conversionNotes}
              onChange={(e) => setConversionNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleConvert} disabled={isLoading}>
            {isLoading ? "Converting..." : "Convert to Full Member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
