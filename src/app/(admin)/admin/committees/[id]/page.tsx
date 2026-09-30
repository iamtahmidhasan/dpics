import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { AdminCommitteeDetailView } from "@/components/admin/admin-committee-detail"
import { ApiError } from "@/lib/api-error"
import { getCommitteeDetail } from "@/lib/services/committee.service"
import { requireAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: "Committee Details",
}

export default async function AdminCommitteeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  let committee
  try {
    committee = await getCommitteeDetail(id)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound()
    throw error
  }

  return <AdminCommitteeDetailView initialCommittee={committee} />
}
