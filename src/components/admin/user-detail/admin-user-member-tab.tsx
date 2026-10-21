"use client"

import { AdminMemberForm } from "@/components/admin/admin-user-forms"
import { AdminUserStatusAlert } from "./admin-user-status-alert"
import { useAdminUser } from "./admin-user-context"

export function AdminUserMemberTab() {
  const { user, saving, save } = useAdminUser()

  return (
    <div className="space-y-6">
      <AdminUserStatusAlert />
      <AdminMemberForm
        key={`member-${user.updatedAt}`}
        user={user}
        saving={saving}
        onSave={save}
      />
    </div>
  )
}
