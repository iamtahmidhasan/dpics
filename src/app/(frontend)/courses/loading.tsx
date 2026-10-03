import { Skeleton } from "@/components/ui/skeleton"

export default function CoursesLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 space-y-8">
      {/* Hero Banner Skeleton */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-card to-card/60 p-6 sm:p-10 text-center flex flex-col items-center space-y-4">
        <Skeleton className="h-6 w-36 rounded-full" />
        <Skeleton className="h-10 sm:h-12 w-3/4 max-w-lg" />
        <Skeleton className="h-4 sm:h-5 w-full max-w-xl" />
        <Skeleton className="h-4 w-2/3 max-w-md" />
      </div>

      {/* Filter and Search Bar Skeleton */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Skeleton className="h-10 flex-1 rounded-lg w-full" />
          <Skeleton className="h-10 w-full sm:w-36 rounded-lg" />
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-20 rounded-full" />
          ))}
        </div>
      </div>

      {/* Courses Grid Skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card shadow-xs"
          >
            <div className="space-y-4">
              {/* Course Thumbnail */}
              <Skeleton className="aspect-video w-full rounded-none" />

              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-16 rounded" />
                  <Skeleton className="h-4 w-14 rounded" />
                </div>

                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-4/5" />
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-2/3" />
                </div>
              </div>
            </div>

            <div className="p-4 pt-0 mt-auto">
              <div className="flex items-center justify-between border-t border-border/50 pt-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-6 rounded-full" />
                  <Skeleton className="h-3.5 w-24" />
                </div>
                <Skeleton className="h-5 w-14 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
