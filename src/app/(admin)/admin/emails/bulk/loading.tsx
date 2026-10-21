import { Skeleton } from "@/components/ui/skeleton"

export default function AdminBulkEmailLoading() {
  return (
    <div className="space-y-4">
      {/* Recipient Target Selection Card */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-3.5 w-72" />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        </div>

        <div className="rounded-lg bg-muted/40 p-3 flex items-center justify-between">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>

      {/* Message Composer Card */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3.5 w-60" />
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>

          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-52 w-full rounded-md" />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
      </div>
    </div>
  )
}
