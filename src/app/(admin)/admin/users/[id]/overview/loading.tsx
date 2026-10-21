import { Skeleton } from "@/components/ui/skeleton"

export default function AdminUserOverviewLoading() {
  return (
    <div className="space-y-6">
      {/* Quick stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>

      {/* Summary card */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <Skeleton className="h-5 w-40" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5 p-3 rounded-lg bg-muted/30">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-36" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
