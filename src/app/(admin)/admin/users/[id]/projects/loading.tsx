import { Skeleton } from "@/components/ui/skeleton"

export default function AdminUserProjectsLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3.5 w-64" />
        </div>
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>

      <div className="rounded-xl border border-border p-3 flex items-center justify-between">
        <div className="flex gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-20 rounded-md" />
          ))}
        </div>
        <Skeleton className="h-7 w-48 rounded-md" />
      </div>

      <div className="rounded-xl border border-border p-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-md" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="h-7 w-24 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}
