import { Skeleton } from "@/components/ui/skeleton"

export default function JoinLoading() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="text-center space-y-2 flex flex-col items-center">
          <Skeleton className="size-10 rounded-xl" />
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-60" />
        </div>

        <div className="space-y-3 pt-2">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        <div className="pt-2 flex justify-center">
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    </div>
  )
}
