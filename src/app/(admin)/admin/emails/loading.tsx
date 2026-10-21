import { Skeleton } from "@/components/ui/skeleton"

export default function AdminEmailsLoading() {
  return (
    <div className="space-y-4">
      {/* Desktop Header Skeleton (>= md) */}
      <div className="hidden md:block space-y-1">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* Desktop Horizontal Tabs Skeleton (>= md) */}
      <div className="hidden md:block border-b border-border">
        <div className="flex gap-2 pb-px overflow-x-auto">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-36 rounded-t-md" />
          ))}
        </div>
      </div>

      {/* Mobile Category Cards Skeleton (< md) */}
      <div className="space-y-2 md:hidden">
        <Skeleton className="h-4 w-32 my-1" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-card"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-xl shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <Skeleton className="size-4 rounded shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Content Grid Skeleton (>= md) */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-16 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
