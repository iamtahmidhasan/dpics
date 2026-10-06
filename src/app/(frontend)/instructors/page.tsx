import type { Metadata } from "next"

import { InstructorsDirectory } from "@/components/instructors/instructors-directory"
import { websiteMetadata } from "@/lib/seo"
import { PublicProfileService } from "@/lib/services/public-profile.service"

const DESCRIPTION =
  "Learn from senior engineers, instructors, and mentors teaching technical courses and leading workshops at DPI Computing Society."

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}): Promise<Metadata> {
  const { page } = await searchParams
  const pageNum = Number.parseInt(page ?? "", 10)
  return websiteMetadata({
    title: "Our Instructors & Mentors",
    description: DESCRIPTION,
    // Paginated pages self-canonicalize so page 2+ is not attributed to page 1.
    path: pageNum > 1 ? `/instructors?page=${pageNum}` : "/instructors",
  })
}

interface InstructorsPageProps {
  searchParams: Promise<{
    search?: string
    page?: string
  }>
}

export default async function InstructorsPage({ searchParams }: InstructorsPageProps) {
  const params = await searchParams
  const page = params.page ? parseInt(params.page, 10) : 1
  const search = params.search || undefined

  const result = await PublicProfileService.listInstructors({
    search,
    page,
    pageSize: 15,
  })

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <InstructorsDirectory
        instructors={result.instructors}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        currentSearch={search}
      />
    </div>
  )
}
