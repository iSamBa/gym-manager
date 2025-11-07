import { memo, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { FormStepProps } from "./types";

export const TrainingPreferenceStep = memo(function TrainingPreferenceStep({
  form,
}: FormStepProps) {
  const gender = form.watch("gender");

  useEffect(() => {
    // Clear training_preference when gender changes to male
    if (gender === "male") {
      form.setValue("training_preference", undefined);
    }
  }, [gender, form]);

  // Only show this section for female members
  if (gender !== "female") {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Training preferences are only available for female members. Please
          select gender as &quot;Female&quot; in Personal Information if this
          applies.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="training_preference"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Session Preference</FormLabel>
            <FormDescription>
              Choose your preferred training session type (optional)
            </FormDescription>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex flex-col space-y-1"
              >
                <FormItem className="flex items-center space-y-0 space-x-3">
                  <FormControl>
                    <RadioGroupItem value="mixed" />
                  </FormControl>
                  <FormLabel className="font-normal">Mixed Sessions</FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-y-0 space-x-3">
                  <FormControl>
                    <RadioGroupItem value="women_only" />
                  </FormControl>
                  <FormLabel className="font-normal">
                    Women Only Sessions
                  </FormLabel>
                </FormItem>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
});
