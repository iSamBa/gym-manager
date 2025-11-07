import React, { memo, useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateMachine } from "../hooks/use-machines";
import { toast } from "sonner";
import type { Machine } from "../lib/types";

interface MachineAvailabilityToggleProps {
  machine: Machine;
}

/**
 * MachineAvailabilityToggle - Admin-only control to enable/disable machines
 *
 * Features:
 * - Only visible to admin role users (returns null for non-admins)
 * - Toggle switch with instant visual feedback
 * - Optimistic UI updates via useUpdateMachine hook
 * - Success toast notifications with clear messaging
 *
 * @see US-010: Machine Availability Admin Controls
 * @see AC-1: Admin Toggle Control
 */
export const MachineAvailabilityToggle = memo<MachineAvailabilityToggleProps>(
  function MachineAvailabilityToggle({ machine }) {
    const { isAdmin } = useAuth();
    const { mutateAsync: updateMachine, isPending } = useUpdateMachine();

    // Handle toggle with optimistic updates and toast notifications
    const handleToggle = useCallback(async () => {
      try {
        await updateMachine({
          id: machine.id,
          data: {
            is_available: !machine.is_available,
          },
        });

        // Show success toast with clear action feedback
        toast.success(
          machine.is_available
            ? `${machine.name} disabled for bookings`
            : `${machine.name} enabled for bookings`
        );
      } catch (error) {
        // Show error toast on failure
        toast.error("Failed to update machine availability", {
          description:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred.",
        });
      }
    }, [machine.id, machine.is_available, machine.name, updateMachine]);

    // Only show to admin users (AC-1: Only visible to admin role)
    if (!isAdmin) return null;

    return (
      <div className="flex items-center gap-2">
        <Switch
          checked={machine.is_available}
          onCheckedChange={handleToggle}
          disabled={isPending}
          aria-label={
            machine.is_available
              ? `Disable ${machine.name} for bookings`
              : `Enable ${machine.name} for bookings`
          }
        />
        <Label className="cursor-pointer text-xs" htmlFor={undefined}>
          {machine.is_available ? "Available" : "Disabled"}
        </Label>
      </div>
    );
  }
);
