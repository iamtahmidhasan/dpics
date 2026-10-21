"use client"

import { AdminUserMedia } from "@/components/admin/admin-user-media"
import { useAdminUser } from "./admin-user-context"

export function AdminUserMediaTab() {
  const { user, isSelf } = useAdminUser()

  return <AdminUserMedia user={user} isSelf={isSelf} />
}
