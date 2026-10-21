"use client"

import { AdminInstructorForm } from "@/components/admin/admin-user-forms"
import { AdminUserStatusAlert } from "./admin-user-status-alert"
import { useAdminUser } from "./admin-user-context"

export function AdminUserInstructorTab() {
  const { user, saving, save } = useAdminUser()

  return (
    <div className="space-y-6">
      <AdminUserStatusAlert />
      <AdminInstructorForm
        key={`instructor-${user.updatedAt}`}
        user={user}
        saving={saving}
        onSave={save}
      />
    </div>
  )
}
