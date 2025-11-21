import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface CardSkeletonProps {
  count?: number;
  columns?: number;
  className?: string;
}

export const CardSkeleton = memo(function CardSkeleton({
  count = 6,
  columns = 3,
  className,
}: CardSkeletonProps) {
  const gridClass = cn(
    "grid gap-4",
    {
      "md:grid-cols-1": columns === 1,
      "md:grid-cols-2": columns === 2,
      "md:grid-cols-2 lg:grid-cols-3": columns === 3,
      "md:grid-cols-2 lg:grid-cols-4": columns === 4,
    },
    className
  );

  return (
    <div
      className={gridClass}
      role="status"
      aria-busy="true"
      aria-label="Loading cards"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-4 rounded-lg border p-6">
          {/* Card header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-8 w-8 rounded" />
          </div>

          {/* Card content */}
          <div className="space-y-4">
            {/* Primary stat */}
            <div className="text-center">
              <Skeleton className="mx-auto h-10 w-24" />
            </div>

            {/* Details */}
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});
