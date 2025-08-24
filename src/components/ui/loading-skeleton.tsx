import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  variant?: "default" | "dashboard" | "auth";
}

export function LoadingSkeleton({
  className,
  variant = "default",
}: LoadingSkeletonProps) {
  if (variant === "dashboard") {
    return (
      <div className="space-y-6 p-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="bg-muted h-8 w-64 animate-pulse rounded" />
            <div className="bg-muted h-4 w-96 animate-pulse rounded" />
          </div>
          <div className="bg-muted h-10 w-32 animate-pulse rounded" />
        </div>

        {/* Stats cards skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2 rounded-lg border p-6">
              <div className="bg-muted h-4 w-24 animate-pulse rounded" />
              <div className="bg-muted h-8 w-16 animate-pulse rounded" />
              <div className="bg-muted h-3 w-32 animate-pulse rounded" />
            </div>
          ))}
        </div>

        {/* Content grid skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-4 rounded-lg border p-6">
              <div className="bg-muted h-5 w-32 animate-pulse rounded" />
              <div className="space-y-3">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="bg-muted h-4 w-24 animate-pulse rounded" />
                      <div className="bg-muted h-3 w-16 animate-pulse rounded" />
                    </div>
                    <div className="bg-muted h-6 w-12 animate-pulse rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "auth") {
    return (
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <div className="flex items-center gap-2 self-center">
            <div className="bg-muted-foreground/20 size-6 animate-pulse rounded-md" />
            <div className="bg-muted-foreground/20 h-5 w-24 animate-pulse rounded" />
          </div>
          <div className="bg-card rounded-xl border p-6">
            <div className="mb-6 space-y-2 text-center">
              <div className="bg-muted mx-auto h-6 w-32 animate-pulse rounded" />
              <div className="bg-muted mx-auto h-4 w-48 animate-pulse rounded" />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="bg-muted h-4 w-12 animate-pulse rounded" />
                <div className="bg-muted h-9 w-full animate-pulse rounded" />
              </div>
              <div className="space-y-2">
                <div className="bg-muted h-4 w-16 animate-pulse rounded" />
                <div className="bg-muted h-9 w-full animate-pulse rounded" />
              </div>
              <div className="bg-muted h-9 w-full animate-pulse rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <div className={cn("bg-muted animate-pulse rounded", className)} />;
}
