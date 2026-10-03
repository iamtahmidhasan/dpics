import { Skeleton } from "@/components/ui/skeleton"

export default function AdminSettingsLoading() {
  return (
    <div className="space-y-4">
      {/* Header Skeleton */}
      <div className="space-y-1">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      {/* Tabs Bar Skeleton */}
      <div className="border-b border-border">
        <div className="flex gap-2 pb-px overflow-x-auto">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-32 rounded-t-md" />
          ))}
        </div>
      </div>

      {/* Settings Card Skeleton */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-5">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-3.5 w-72" />
        </div>

        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3.5 border border-border/80 rounded-lg">
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-3/4" />
              </div>
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Save Action Bar Skeleton */}
      <div className="rounded-lg border border-border bg-card p-4 flex items-center justify-between">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
    </div>
  )
}
