import { Skeleton } from "@/components/ui/skeleton"

export default function AdminUserAchievementsLoading() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3.5 w-60" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-48" />
          </div>
        ))}
      </div>
    </div>
  )
}
