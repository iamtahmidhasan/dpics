import { Skeleton } from "@/components/ui/skeleton"

export default function LearnLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Classroom Top Bar */}
      <header className="h-14 border-b border-border bg-card/60 backdrop-blur-md px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-4 w-48 sm:w-64" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-2.5 w-32 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </header>

      {/* Main Classroom Split Grid */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left: Video Player & Tabs */}
        <div className="flex-1 flex flex-col p-4 md:p-6 space-y-6">
          {/* 16:9 Video Canvas Skeleton */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-muted/70 flex items-center justify-center">
            <Skeleton className="size-16 rounded-full" />
          </div>

          {/* Lesson Title & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-3/4 max-w-md" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-28 rounded-md" />
              <Skeleton className="h-9 w-28 rounded-md" />
            </div>
          </div>

          {/* Tabs Navigation Skeleton */}
          <div className="border-b border-border">
            <div className="flex gap-4 pb-2">
              <Skeleton className="h-7 w-20 rounded" />
              <Skeleton className="h-7 w-20 rounded" />
              <Skeleton className="h-7 w-20 rounded" />
              <Skeleton className="h-7 w-20 rounded" />
            </div>
          </div>

          {/* Lesson Content Skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        </div>

        {/* Right: Curriculum Module Sidebar Skeleton */}
        <div className="hidden lg:flex w-80 xl:w-96 border-l border-border bg-card/30 flex-col p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="size-4 rounded" />
                </div>
                <div className="space-y-1.5 pl-2 pt-1">
                  <Skeleton className="h-3 w-4/5" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
