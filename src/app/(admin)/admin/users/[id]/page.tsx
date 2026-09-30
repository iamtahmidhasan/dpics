import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { AdminUserDetailView } from "@/components/admin/admin-user-detail"
import { ApiError } from "@/lib/api-error"
import { getAdminUserDetail } from "@/lib/services/admin-user.service"
import { requireAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: "User",
}

export default async function AdminUserDetailPage({ params }: PageProps<"/admin/users/[id]">) {
  const session = await requireAdmin()
  const { id } = await params

  let user
  try {
    user = await getAdminUserDetail(id)
  } catch (error) {
    // A missing user is a 404 page; anything else is a real failure.
    if (error instanceof ApiError && error.status === 404) notFound()

    throw error
  }

  return <AdminUserDetailView initialUser={user} isSelf={user.id === session.user.id} />
}