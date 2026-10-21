import { Skeleton } from "@/components/ui/skeleton"

export default function VerifyLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 md:py-16 space-y-8">
      <div className="text-center space-y-3 max-w-md mx-auto">
        <Skeleton className="h-6 w-36 mx-auto rounded-full" />
        <Skeleton className="h-10 w-72 mx-auto" />
        <Skeleton className="h-4 w-full" />
      </div>

      <div className="rounded-2xl border border-border p-8 space-y-6">
        <div className="flex gap-3">
          <Skeleton className="h-12 flex-1 rounded-xl" />
          <Skeleton className="h-12 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
