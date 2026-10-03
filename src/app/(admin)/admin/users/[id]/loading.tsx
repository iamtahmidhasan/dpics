import { Skeleton } from "@/components/ui/skeleton"

export default function AdminUserDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Header Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-14" />
        <span className="text-muted-foreground/40">/</span>
        <Skeleton className="h-4 w-28" />
      </div>

      {/* User Header Summary Card Skeleton */}
      <div className="rounded-xl border border-border bg-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 rounded-full shrink-0" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-44" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>

      {/* Tabs Bar Skeleton */}
      <div className="border-b border-border">
        <div className="flex gap-2 pb-px overflow-x-auto">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-t-md" />
          ))}
        </div>
      </div>

      {/* Form Content Card Skeleton */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3.5 w-64" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>
    </div>
  )
}
