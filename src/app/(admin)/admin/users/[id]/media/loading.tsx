import { Skeleton } from "@/components/ui/skeleton"

export default function AdminUserMediaLoading() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3.5 w-60" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-36 w-full rounded-lg" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>
    </div>
  )
}
