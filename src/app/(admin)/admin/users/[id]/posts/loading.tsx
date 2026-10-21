import { Skeleton } from "@/components/ui/skeleton"

export default function AdminUserPostsLoading() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3.5 w-60" />
        </div>
      </div>

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-3">
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-52" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
