import type { Metadata } from "next"

import { MembersDirectory } from "@/components/members/members-directory"
import { PublicProfileService } from "@/lib/services/public-profile.service"
import { Department } from "@/generated/prisma/enums"
import { SITE_NAME, SITE_URL } from "@/lib/site"

export const metadata: Metadata = {
  title: `Society Members Directory | ${SITE_NAME}`,
  description:
    "Explore the active student members, contributors, and leaders of Dhaka Polytechnic Institute Computing Society.",
  alternates: { canonical: `${SITE_URL}/members` },
  openGraph: {
    title: `Society Members Directory | ${SITE_NAME}`,
    description:
      "Explore the active student members, contributors, and leaders of Dhaka Polytechnic Institute Computing Society.",
    url: `${SITE_URL}/members`,
    type: "website",
  },
}

interface MembersPageProps {
  searchParams: Promise<{
    search?: string
    department?: string
    session?: string
    page?: string
  }>
}

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const params = await searchParams
  const page = params.page ? parseInt(params.page, 10) : 1
  const search = params.search || undefined
  const department = (
    params.department && Object.values(Department).includes(params.department as Department)
      ? (params.department as Department)
      : undefined
  )
  const session = params.session || undefined

  const result = await PublicProfileService.listMembers({
    search,
    department,
    session,
    page,
    pageSize: 16,
  })

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <MembersDirectory
        members={result.members}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        currentSearch={search}
        currentDepartment={params.department}
        currentSession={session}
      />
    </div>
  )
}
