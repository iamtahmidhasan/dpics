import { Skeleton } from "@/components/ui/skeleton"

export default function AdminEmailSettingsLoading() {
  return (
    <div className="space-y-4">
      {/* SMTP Provider Config Card */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-3.5 w-80 max-w-full" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>
    </div>
  )
}
