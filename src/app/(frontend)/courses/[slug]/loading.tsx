import { Skeleton } from "@/components/ui/skeleton"

export default function CourseDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-8 space-y-8">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <span className="text-muted-foreground/40">/</span>
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Course Title Header Skeleton */}
      <div className="space-y-4 max-w-3xl">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-10 sm:h-12 w-full" />
        <Skeleton className="h-5 w-4/5" />
        <div className="flex flex-wrap items-center gap-4 pt-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column (Content) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Video Preview Skeleton */}
          <Skeleton className="aspect-video w-full rounded-2xl" />

          {/* Description Section */}
          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          {/* Curriculum Section Skeleton */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>

            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Enrollment CTA Card Skeleton) */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-6 shadow-sm sticky top-20">
            <div className="space-y-2">
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-4 w-40" />
            </div>

            <Skeleton className="h-11 w-full rounded-xl" />

            <div className="space-y-3 pt-4 border-t border-border/50">
              <Skeleton className="h-4 w-36 font-semibold" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="size-4 rounded-full" />
                  <Skeleton className="h-3.5 flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
