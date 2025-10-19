/**
 * Body Checkup Dialog
 * Modal for adding/editing member body checkup records
 */

"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatForDatabase, getStartOfDay } from "@/lib/date-utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { BodyCheckup } from "../lib/types";

const formSchema = z.object({
  checkup_date: z.date(),
  weight: z
    .number()
    .min(1, "Weight must be at least 1 kg")
    .max(999.99, "Weight must be at most 999.99 kg")
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(1000, "Notes must be at most 1000 characters")
    .optional()
    .nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface BodyCheckupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  checkup?: BodyCheckup | null;
  onSave: (data: {
    member_id: string;
    checkup_date: string;
    weight?: number | null;
    notes?: string | null;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function BodyCheckupDialog({
  open,
  onOpenChange,
  memberId,
  checkup,
  onSave,
  isLoading = false,
}: BodyCheckupDialogProps) {
  const isEditing = !!checkup;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      checkup_date: checkup ? new Date(checkup.checkup_date) : new Date(),
      weight: checkup?.weight ?? null,
      notes: checkup?.notes ?? "",
    },
  });

  // Reset form when dialog opens/closes or checkup changes
  useEffect(() => {
    if (open) {
      form.reset({
        checkup_date: checkup ? new Date(checkup.checkup_date) : new Date(),
        weight: checkup?.weight ?? null,
        notes: checkup?.notes ?? "",
      });
    }
  }, [open, checkup, form]);

  const onSubmit = async (values: FormValues) => {
    await onSave({
      member_id: memberId,
      checkup_date: formatForDatabase(values.checkup_date),
      weight: values.weight,
      notes: values.notes || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            {isEditing ? "Edit Body Checkup" : "Add Body Checkup"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the body checkup record below"
              : "Record a new body checkup for this member"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Checkup Date */}
            <FormField
              control={form.control}
              name="checkup_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Checkup Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > getStartOfDay()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Date when the checkup was performed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Weight */}
            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="75.5"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? null : parseFloat(value));
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Member&apos;s weight in kilograms (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes or observations..."
                      className="resize-none"
                      rows={4}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional notes about the checkup (max 1000 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : isEditing ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
