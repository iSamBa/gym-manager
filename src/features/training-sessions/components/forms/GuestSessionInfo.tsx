import React, { memo } from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { UseFormReturn } from "react-hook-form";
import type { CreateSessionData, SessionType } from "../../lib/types";

interface GuestSessionInfoProps {
  form: UseFormReturn<CreateSessionData>;
  sessionType: SessionType;
}

/**
 * GuestSessionInfo Component
 *
 * Conditionally renders guest information capture forms based on session type:
 * - Multi-site: 3 fields (guest_first_name, guest_last_name, guest_gym_name) with purple styling
 * - Collaboration: No longer uses guest info - uses member selection instead
 * - Other types: returns null
 *
 * @param form - React Hook Form instance
 * @param sessionType - Current session type to determine rendering
 */
export const GuestSessionInfo = memo<GuestSessionInfoProps>(
  function GuestSessionInfo({ form, sessionType }) {
    // Only render for multi_site sessions (true guest sessions)
    // Collaboration sessions now use member selection (collaboration members)
    if (sessionType === "multi_site") {
      return (
        <div className="space-y-4 rounded-lg border bg-purple-50 p-4 dark:bg-purple-950/20">
          <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-100">
            Multi-Site Guest Information
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="guest_first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guest First Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Guest first name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="guest_last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guest Last Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Guest last name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="guest_gym_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Origin Gym *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Which gym are they from?" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      );
    }

    // Collaboration sessions now use member selection (no guest info needed)
    return null;
  }
);
