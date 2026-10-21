import { Skeleton } from "@/components/ui/skeleton"

export default function AdminEmailTemplatesLoading() {
  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Skeleton className="h-9 w-64 rounded-md" />
        <Skeleton className="h-9 w-32 rounded-md self-end sm:self-auto" />
      </div>

      {/* Templates grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <Skeleton className="h-3 w-24" />
              <div className="flex gap-1.5">
                <Skeleton className="size-7 rounded-md" />
                <Skeleton className="size-7 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
