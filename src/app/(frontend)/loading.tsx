import { Skeleton } from "@/components/ui/skeleton"

export default function FrontendLoading() {
  return (
    <div className="w-full min-h-[70vh] flex flex-col items-center">
      {/* Hero Section Skeleton */}
      <section className="w-full max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 flex flex-col items-center text-center space-y-6">
        <Skeleton className="h-7 w-48 rounded-full" />
        <div className="space-y-3 max-w-3xl w-full flex flex-col items-center">
          <Skeleton className="h-12 sm:h-16 w-3/4 max-w-xl" />
          <Skeleton className="h-5 sm:h-6 w-full max-w-lg" />
          <Skeleton className="h-5 w-2/3 max-w-md" />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <Skeleton className="h-10 w-36 rounded-md" />
          <Skeleton className="h-10 w-36 rounded-md" />
        </div>
      </section>

      {/* Grid Cards Skeleton */}
      <section className="w-full max-w-7xl mx-auto px-4 md:px-8 py-10">
        <div className="flex items-center justify-between pb-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-4">
              <Skeleton className="h-44 w-full rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 rounded-full" />
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-7 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
