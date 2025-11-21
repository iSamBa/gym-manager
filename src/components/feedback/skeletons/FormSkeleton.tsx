import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface FormSkeletonProps {
  fieldCount?: number;
  hasMultiStep?: boolean;
  className?: string;
}

export const FormSkeleton = memo(function FormSkeleton({
  fieldCount = 6,
  hasMultiStep = false,
  className,
}: FormSkeletonProps) {
  return (
    <div
      className={cn("space-y-6", className)}
      role="status"
      aria-busy="true"
      aria-label="Loading form"
    >
      {/* Multi-step indicator (optional) */}
      {hasMultiStep && (
        <div className="flex items-center justify-between">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-16" />
              {i < 2 && <Skeleton className="h-0.5 w-12" />}
            </div>
          ))}
        </div>
      )}

      {/* Form header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Form fields */}
      <div className="space-y-6">
        {Array.from({ length: fieldCount }).map((_, i) => (
          <div key={i} className="space-y-2">
            {/* Field label */}
            <Skeleton className="h-4 w-24" />
            {/* Field input */}
            <Skeleton className="h-10 w-full" />
            {/* Field description/error */}
            {i % 3 === 0 && <Skeleton className="h-3 w-64" />}
          </div>
        ))}
      </div>

      {/* Form actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
});
