import { Skeleton } from "@/components/ui/skeleton"

export default function AdminCategoryLoading() {
  return (
    <div className="space-y-4">
      {/* Header Skeleton */}
      <div className="space-y-1">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Tabs / Filter Row Skeleton */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-md" />
        ))}
      </div>

      {/* Categories Card Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-12 rounded-full" />
            </div>
            <Skeleton className="h-3.5 w-48" />
            <div className="pt-2 flex justify-end gap-2 border-t border-border/50">
              <Skeleton className="h-7 w-12 rounded" />
              <Skeleton className="h-7 w-12 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
