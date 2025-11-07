import { memo } from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { SessionTypeSelector } from "../forms/SessionTypeSelector";
import { SessionLimitWarning } from "../SessionLimitWarning";
import type { UseFormReturn } from "react-hook-form";
import type { CreateSessionData } from "../../lib/validation";

interface SessionTypeStepProps {
  form: UseFormReturn<CreateSessionData>;
  selectedDate: Date;
  sessionType: CreateSessionData["session_type"];
  onNext: () => void;
  onCancel: () => void;
}

export const SessionTypeStep = memo(function SessionTypeStep({
  form,
  selectedDate,
  sessionType,
  onNext,
  onCancel,
}: SessionTypeStepProps) {
  return (
    <>
      {/* Studio capacity warning */}
      {form.watch("scheduled_start") && (
        <SessionLimitWarning date={selectedDate} />
      )}

      {/* Session Type Selector */}
      <FormField
        control={form.control}
        name="session_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Session Type *</FormLabel>
            <FormControl>
              <SessionTypeSelector
                value={field.value}
                onChange={field.onChange}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Navigation */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={onNext} disabled={!sessionType}>
          Next →
        </Button>
      </div>
    </>
  );
});
