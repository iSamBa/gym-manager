import { memo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { FormStepProps } from "./types";

export const CapacityStep = memo(function CapacityStep({
  form,
}: FormStepProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Optional:</strong> Configure trainer capacity and availability
          settings.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="max_clients_per_session"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Clients per Session</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  placeholder="1"
                  className="h-12"
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  value={
                    field.value === undefined || field.value === null
                      ? ""
                      : field.value
                  }
                  min="1"
                  max="50"
                />
              </FormControl>
              <FormDescription>
                Maximum number of clients in a single training session
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_accepting_new_clients"
          render={({ field }) => (
            <FormItem className="flex flex-col justify-center rounded-lg border p-4">
              <div className="flex items-center space-x-3">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-describedby="accepting-clients-description"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="font-medium">
                    Accepting New Clients
                  </FormLabel>
                  <FormDescription id="accepting-clients-description">
                    Allow this trainer to accept new client bookings
                  </FormDescription>
                </div>
              </div>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
});
