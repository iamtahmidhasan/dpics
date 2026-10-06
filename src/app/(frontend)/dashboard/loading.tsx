import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-8 space-y-8">
      {/* Header Profile Summary Skeleton */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 sm:size-20 rounded-2xl shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-36" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-4 w-16 rounded-md" />
              <Skeleton className="h-4 w-20 rounded-md" />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>

      {/* 4 Metric KPI Cards Skeleton */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/70 bg-card p-5 space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="size-8 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-12" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>

      {/* Main Two-Column Skeleton */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {/* Courses skeleton */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-44" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border/70 bg-card p-5 space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-8 w-full rounded-md mt-4" />
                </div>
              ))}
            </div>
          </div>

          {/* Events skeleton */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-44" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border/70 bg-card p-5 space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-8 w-full rounded-md mt-4" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column skeleton */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border/70 bg-card p-5 space-y-4">
            <Skeleton className="h-5 w-36" />
            <div className="space-y-3 pt-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
