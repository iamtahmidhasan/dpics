"use client"

import { AdminCommitteeForm } from "@/components/admin/admin-user-forms"
import { AdminUserStatusAlert } from "./admin-user-status-alert"
import { useAdminUser } from "./admin-user-context"

export function AdminUserCommitteeTab() {
  const { user, setUser } = useAdminUser()

  return (
    <div className="space-y-6">
      <AdminUserStatusAlert />
      <AdminCommitteeForm
        key={`committee-${user.updatedAt}`}
        user={user}
        onUserUpdated={setUser}
      />
    </div>
  )
}
