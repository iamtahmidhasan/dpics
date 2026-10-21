import { Skeleton } from "@/components/ui/skeleton"

export default function AdminUserTemplatesLoading() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3.5 w-60" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-32 w-full rounded-lg" />
            <div className="flex justify-between pt-2">
              <Skeleton className="h-8 w-24 rounded-md" />
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
