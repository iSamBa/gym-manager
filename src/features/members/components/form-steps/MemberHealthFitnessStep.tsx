import { UseFormReturn } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface MemberHealthFitnessStepProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
}

export function MemberHealthFitnessStep({
  form,
}: MemberHealthFitnessStepProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Optional:</strong> This information helps trainers provide
          better guidance.
        </p>
      </div>

      <FormField
        control={form.control}
        name="fitness_goals"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Fitness Goals</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe fitness goals (e.g., weight loss, muscle gain, endurance training)..."
                className="min-h-[100px] resize-none"
                {...field}
              />
            </FormControl>
            <FormDescription>
              What does the member want to achieve?
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="medical_conditions"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Medical Conditions</FormLabel>
            <FormControl>
              <Textarea
                placeholder="List any relevant medical conditions or injuries..."
                className="min-h-[100px] resize-none"
                {...field}
              />
            </FormControl>
            <FormDescription>
              Information that trainers should be aware of for safety.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
