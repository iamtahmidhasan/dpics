"use client"

import { AdminUserTemplates } from "@/components/admin/admin-user-templates"
import { useAdminUser } from "./admin-user-context"

export function AdminUserTemplatesTab() {
  const { user, templateAssignments, availableTemplates } = useAdminUser()

  return (
    <AdminUserTemplates
      user={user}
      initialAssignments={templateAssignments}
      availableTemplates={availableTemplates}
    />
  )
}
