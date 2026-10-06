import type { Metadata } from "next"

import { MembersDirectory } from "@/components/members/members-directory"
import { websiteMetadata } from "@/lib/seo"
import { PublicProfileService } from "@/lib/services/public-profile.service"
import { Department } from "@/generated/prisma/enums"

const DESCRIPTION =
  "Explore the active student members, contributors, and leaders of Dhaka Polytechnic Institute Computing Society."

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}): Promise<Metadata> {
  const { page } = await searchParams
  const pageNum = Number.parseInt(page ?? "", 10)
  return websiteMetadata({
    title: "Society Members Directory",
    description: DESCRIPTION,
    // Paginated pages self-canonicalize so page 2+ is not attributed to page 1.
    path: pageNum > 1 ? `/members?page=${pageNum}` : "/members",
  })
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
