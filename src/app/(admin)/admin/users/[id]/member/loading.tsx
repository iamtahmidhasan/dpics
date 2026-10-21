import { Skeleton } from "@/components/ui/skeleton"

export default function AdminUserMemberLoading() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-3.5 w-64" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
    </div>
  )
}
