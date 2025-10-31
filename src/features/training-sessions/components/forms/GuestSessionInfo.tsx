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
 * - Collaboration: 1 field (collaboration_details textarea) with lime styling
 * - Other types: returns null
 *
 * @param form - React Hook Form instance
 * @param sessionType - Current session type to determine rendering
 */
export const GuestSessionInfo = memo<GuestSessionInfoProps>(
  function GuestSessionInfo({ form, sessionType }) {
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

    if (sessionType === "collaboration") {
      return (
        <div className="space-y-4 rounded-lg border bg-lime-50 p-4 dark:bg-lime-950/20">
          <h3 className="text-sm font-semibold text-lime-900 dark:text-lime-100">
            Collaboration Session
          </h3>

          <FormField
            control={form.control}
            name="collaboration_details"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Influencer Name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Influencer or partner name" />
                </FormControl>
                <FormMessage />
                <p className="text-xs text-lime-800 dark:text-lime-200">
                  This will be displayed as the session title
                </p>
              </FormItem>
            )}
          />
        </div>
      );
    }

    return null;
  }
);
