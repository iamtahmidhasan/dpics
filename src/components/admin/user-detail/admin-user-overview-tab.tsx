"use client"

import { useRouter } from "next/navigation"

import { AdminUserOverview } from "@/components/admin/admin-user-overview"
import { useAdminUser } from "./admin-user-context"

export function AdminUserOverviewTab() {
  const router = useRouter()
  const { user, isSelf } = useAdminUser()

  return (
    <AdminUserOverview
      user={user}
      isSelf={isSelf}
      onManageCommittees={() => router.push(`/admin/users/${user.id}/committee`)}
    />
  )
}
