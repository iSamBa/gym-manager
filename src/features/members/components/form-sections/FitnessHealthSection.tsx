import React, { memo } from "react";
import { Control } from "react-hook-form";
import { Target } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MemberFormData } from "../progressive-form/types";

interface FitnessHealthSectionProps {
  control: Control<MemberFormData>;
}

export const FitnessHealthSection = memo(function FitnessHealthSection({
  control,
}: FitnessHealthSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5" />
          Fitness & Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="fitness_goals"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fitness Goals</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe fitness goals..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional: Member&apos;s fitness objectives and goals
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="medical_conditions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Medical Conditions</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="List any relevant medical conditions..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional: Any medical conditions trainers should be aware of
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
});
