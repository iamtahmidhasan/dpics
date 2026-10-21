import { Skeleton } from "@/components/ui/skeleton"

export default function AdminMemberIdLoading() {
  return (
    <div className="space-y-4">
      {/* Student ID & Batch Settings Card */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-5">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-52" />
            <Skeleton className="h-3.5 w-96 max-w-full" />
          </div>
          <Skeleton className="h-6 w-24 rounded shrink-0" />
        </div>

        <div className="space-y-4">
          {/* Auto Student ID Toggle */}
          <div className="flex items-center justify-between p-3.5 border border-border/80 rounded-lg">
            <div className="space-y-1.5 flex-1 pr-4">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-4/5" />
            </div>
            <Skeleton className="h-6 w-11 rounded-full shrink-0" />
          </div>

          {/* 3 Inputs Grid */}
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-full rounded-md" />
                <Skeleton className="h-3 w-40" />
              </div>
            ))}
          </div>

          {/* Live Preview & Batch Status Card */}
          <div className="rounded-lg border border-border/80 bg-muted/30 p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-24 rounded" />
              </div>
              <Skeleton className="h-3 w-36" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded border bg-background p-2 space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Save Action Bar Skeleton */}
      <div className="rounded-lg border border-primary/20 bg-card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-9 w-36 rounded-md self-end sm:self-auto" />
      </div>
    </div>
  )
}
