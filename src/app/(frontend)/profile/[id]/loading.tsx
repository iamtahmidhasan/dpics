import { Skeleton } from "@/components/ui/skeleton"

export default function PublicProfileLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 space-y-6">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-12" />
        <span className="text-muted-foreground/40">/</span>
        <Skeleton className="h-4 w-20" />
        <span className="text-muted-foreground/40">/</span>
        <Skeleton className="h-4 w-28" />
      </div>

      {/* Profile Card Header Skeleton */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        {/* Decorative banner */}
        <Skeleton className="h-28 sm:h-36 w-full rounded-none" />

        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
            <div className="flex items-end gap-3.5">
              <Skeleton className="size-24 sm:size-28 rounded-2xl border-4 border-card" />
              <div className="space-y-1.5 pb-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-44 sm:w-56" />
                  <Skeleton className="size-5 rounded-full" />
                </div>
                <Skeleton className="h-4 w-36" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-28 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-md" />
            </div>
          </div>

          <div className="pt-2 space-y-2 max-w-2xl">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="border-b border-border">
        <div className="flex gap-4 pb-2">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>

      {/* Content Skeleton Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <Skeleton className="h-36 w-full rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
