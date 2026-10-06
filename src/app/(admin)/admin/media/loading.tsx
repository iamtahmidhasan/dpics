import { Skeleton } from "@/components/ui/skeleton"

export default function AdminMediaLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-1">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-40" />
          </div>
        ))}
      </div>

      {/* Upload Zone Skeleton */}
      <div className="rounded-xl border border-dashed border-border p-6 flex flex-col items-center justify-center space-y-2">
        <Skeleton className="size-10 rounded-full" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-64" />
      </div>

      {/* Search & Filter Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-60 rounded-md" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-32 rounded-md" />
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card overflow-hidden space-y-2 p-2">
            <Skeleton className="aspect-square w-full rounded-md" />
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}
