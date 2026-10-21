"use client"

import { AdminAccountForm } from "@/components/admin/admin-user-forms"
import { AdminUserDangerZone } from "./admin-user-danger-zone"
import { AdminUserStatusAlert } from "./admin-user-status-alert"
import { useAdminUser } from "./admin-user-context"

export function AdminUserAccountTab() {
  const { user, isSelf, isActorSuperAdmin, saving, save } = useAdminUser()

  return (
    <div className="space-y-6">
      <AdminUserStatusAlert />
      <AdminAccountForm
        key={`account-${user.updatedAt}`}
        user={user}
        isSelf={isSelf}
        isActorSuperAdmin={isActorSuperAdmin}
        saving={saving}
        onSave={save}
      />
      <AdminUserDangerZone />
    </div>
  )
}
