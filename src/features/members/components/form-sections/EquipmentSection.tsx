import React, { memo } from "react";
import { Control } from "react-hook-form";
import { Package } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EquipmentSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
}

export const EquipmentSection = memo(function EquipmentSection({
  control,
}: EquipmentSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="h-5 w-5" />
          Equipment Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Uniform Size */}
          <FormField
            control={control}
            name="uniform_size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Uniform Size *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
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

          {/* Uniform Received */}
          <FormField
            control={control}
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
                  <FormDescription>
                    Check when member picks up uniform
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {/* Vest Size */}
          <FormField
            control={control}
            name="vest_size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vest Size *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
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

          {/* Hip Belt Size */}
          <FormField
            control={control}
            name="hip_belt_size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hip Belt Size *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
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
      </CardContent>
    </Card>
  );
});
