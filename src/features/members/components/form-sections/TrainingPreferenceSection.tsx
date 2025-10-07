import React, { memo, useEffect } from "react";
import { Control, useWatch } from "react-hook-form";
import { Users } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TrainingPreferenceSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: any; // To clear training_preference when gender changes
}

export const TrainingPreferenceSection = memo(
  function TrainingPreferenceSection({
    control,
    setValue,
  }: TrainingPreferenceSectionProps) {
    // Watch gender to show/hide this section
    const gender = useWatch({
      control,
      name: "gender",
    });

    // Clear training_preference when gender changes to male
    useEffect(() => {
      if (gender === "male") {
        setValue("training_preference", undefined);
      }
    }, [gender, setValue]);

    // Only show this section for female members
    if (gender !== "female") {
      return null;
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Training Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={control}
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
                      <FormLabel className="font-normal">
                        Mixed Sessions
                      </FormLabel>
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
        </CardContent>
      </Card>
    );
  }
);
