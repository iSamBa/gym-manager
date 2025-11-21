import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface DetailPageSkeletonProps {
  hasTabs?: boolean;
  cardCount?: number;
  className?: string;
}

export const DetailPageSkeleton = memo(function DetailPageSkeleton({
  hasTabs = false,
  cardCount = 4,
  className,
}: DetailPageSkeletonProps) {
  return (
    <div
      className={cn("space-y-6", className)}
      role="status"
      aria-busy="true"
      aria-label="Loading page details"
    >
      {/* Back button skeleton */}
      <Skeleton className="h-9 w-32" />

      {/* Page header skeleton */}
      <div className="space-y-4 rounded-lg border p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>

      {/* Tab bar skeleton (optional) */}
      {hasTabs && (
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-32 rounded-md" />
          ))}
        </div>
      )}

      {/* Content layout: 2 columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: Main content */}
        <div className="space-y-6 lg:col-span-2">
          {Array.from({ length: Math.ceil(cardCount / 2) }).map((_, i) => (
            <div key={i} className="space-y-4 rounded-lg border p-6">
              {/* Card header */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
              {/* Card content */}
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right column: Sidebar */}
        <div className="space-y-6">
          {Array.from({ length: Math.floor(cardCount / 2) }).map((_, i) => (
            <div key={i} className="space-y-4 rounded-lg border p-6">
              {/* Card header */}
              <Skeleton className="h-6 w-24" />
              {/* Card content */}
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j}>
                    <Skeleton className="mb-1 h-3 w-16" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
