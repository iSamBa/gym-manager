import { memo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { FormStepProps } from "./types";

export const EquipmentStep = memo(function EquipmentStep({
  form,
}: FormStepProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="uniform_size"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Uniform Size *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="XS">XS</SelectItem>
                  <SelectItem value="S">S</SelectItem>
                  <SelectItem value="M">M</SelectItem>
                  <SelectItem value="L">L</SelectItem>
                  <SelectItem value="XL">XL</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="uniform_received"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-y-0 space-x-3 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Uniform Received</FormLabel>
                <FormDescription className="text-xs">
                  Check when member picks up uniform
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vest_size"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vest Size *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select vest size" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="V1">V1</SelectItem>
                  <SelectItem value="V2">V2</SelectItem>
                  <SelectItem value="V2_SMALL_EXT">
                    V2 with Small Extension
                  </SelectItem>
                  <SelectItem value="V2_LARGE_EXT">
                    V2 with Large Extension
                  </SelectItem>
                  <SelectItem value="V2_DOUBLE_EXT">
                    V2 with Double Extension
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hip_belt_size"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hip Belt Size *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select belt size" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="V1">V1</SelectItem>
                  <SelectItem value="V2">V2</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
});
