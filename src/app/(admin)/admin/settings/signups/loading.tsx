import { Skeleton } from "@/components/ui/skeleton"

export default function AdminSignupsLoading() {
  return (
    <div className="space-y-4">
      {/* Signups Card Skeleton */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-5">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-3.5 w-80 max-w-full" />
        </div>

        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3.5 border border-border/80 rounded-lg"
            >
              <div className="space-y-1.5 flex-1 pr-4">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-3 w-4/5" />
              </div>
              <Skeleton className="h-6 w-11 rounded-full shrink-0" />
            </div>
          ))}
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
