import { Skeleton } from "@/components/ui/skeleton"

export default function AdminPaymentsLoading() {
  return (
    <div className="space-y-4">
      {/* Reusable Payment System Info Banner */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5 flex items-start gap-2.5">
        <Skeleton className="size-4 rounded-full shrink-0 mt-0.5" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </div>

      {/* Member Registration Fee Card */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3.5 w-96 max-w-full" />
        </div>

        <div className="space-y-3">
          {/* Require Fee Toggle */}
          <div className="flex items-center justify-between p-3.5 border border-border/80 rounded-lg">
            <div className="space-y-1.5 flex-1 pr-4">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-4/5" />
            </div>
            <Skeleton className="h-6 w-11 rounded-full shrink-0" />
          </div>

          {/* Fee Input */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-9 w-48 rounded-md" />
            <Skeleton className="h-3 w-64" />
          </div>
        </div>
      </div>

      {/* MFS Recipient Numbers Card */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-5">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-60" />
          <Skeleton className="h-3.5 w-96 max-w-full" />
        </div>

        <div className="space-y-5">
          {/* bKash, Nagad, Rocket */}
          {["bKash", "Nagad", "Rocket"].map((provider, i) => (
            <div key={provider} className="space-y-3">
              {i > 0 && <div className="border-t border-border/60 my-2" />}
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-28 rounded" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-9 w-full rounded-md" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-9 w-full rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save Action Bar Skeleton */}
      <div className="rounded-lg border border-primary/20 bg-card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-9 w-36 rounded-md self-end sm:self-auto" />
      </div>
    </div>
  )
}
