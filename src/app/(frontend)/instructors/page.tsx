import type { Metadata } from "next"

import { InstructorsDirectory } from "@/components/instructors/instructors-directory"
import { PublicProfileService } from "@/lib/services/public-profile.service"
import { SITE_NAME, SITE_URL } from "@/lib/site"

export const metadata: Metadata = {
  title: `Our Instructors & Mentors | ${SITE_NAME}`,
  description:
    "Learn from senior engineers, instructors, and mentors teaching technical courses and leading workshops at DPI Computing Society.",
  alternates: { canonical: `${SITE_URL}/instructors` },
  openGraph: {
    title: `Our Instructors & Mentors | ${SITE_NAME}`,
    description:
      "Learn from senior engineers, instructors, and mentors teaching technical courses and leading workshops at DPI Computing Society.",
    url: `${SITE_URL}/instructors`,
    type: "website",
  },
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
