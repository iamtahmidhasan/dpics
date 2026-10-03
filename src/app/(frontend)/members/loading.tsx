import { Skeleton } from "@/components/ui/skeleton"

export default function MembersLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-8 w-56 sm:w-72" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <Skeleton className="h-7 w-32 rounded-md" />
      </div>

      {/* Filter Bar Skeleton */}
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <Skeleton className="h-9 flex-1 rounded-md" />
          <Skeleton className="h-9 w-44 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
        </div>
      </div>

      {/* Members Grid Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 space-y-3"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <Skeleton className="size-14 rounded-xl" />
                <div className="flex flex-col items-end gap-1.5">
                  <Skeleton className="h-4 w-16 rounded" />
                  <Skeleton className="h-4 w-12 rounded" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-border/50 flex items-center justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
