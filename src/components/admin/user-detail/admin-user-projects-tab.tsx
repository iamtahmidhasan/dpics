"use client"

import { AdminUserProjects } from "@/components/admin/admin-user-projects"
import { useAdminUser } from "./admin-user-context"

export function AdminUserProjectsTab() {
  const { user, projects } = useAdminUser()

  return (
    <AdminUserProjects
      userId={user.id}
      userName={user.name || user.email}
      initialProjects={projects}
    />
  )
}
