import { Skeleton } from "@/components/ui/skeleton"

export default function PostsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 space-y-8">
      {/* Blog Header Skeleton */}
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-64 sm:w-80" />
        <Skeleton className="h-4 w-full" />
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-3">
        <Skeleton className="h-10 w-full max-w-md rounded-lg" />
        <div className="flex flex-wrap items-center gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-20 rounded-full" />
          ))}
        </div>
      </div>

      {/* Featured / Grid Skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card shadow-xs space-y-4"
          >
            <Skeleton className="aspect-video w-full rounded-none" />

            <div className="p-4 pt-0 space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-16 rounded" />
                <Skeleton className="h-4 w-12 rounded" />
              </div>

              <div className="space-y-1.5">
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>

            <div className="p-4 pt-0 border-t border-border/50 mt-auto">
              <div className="flex items-center justify-between pt-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-6 rounded-full" />
                  <Skeleton className="h-3.5 w-20" />
                </div>
                <Skeleton className="h-3.5 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
