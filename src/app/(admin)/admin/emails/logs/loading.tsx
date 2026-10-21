import { Skeleton } from "@/components/ui/skeleton"

export default function AdminEmailLogsLoading() {
  return (
    <div className="space-y-4">
      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <Skeleton className="h-9 w-64 rounded-md" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      {/* Logs Table / Cards List */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>

        <div className="divide-y divide-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-64" />
              </div>
              <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="size-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
