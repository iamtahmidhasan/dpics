"use client"

import { AdminUserAchievements } from "@/components/admin/admin-user-achievements"
import { useAdminUser } from "./admin-user-context"

export function AdminUserAchievementsTab() {
  const { user, achievements } = useAdminUser()

  return (
    <AdminUserAchievements
      userId={user.id}
      userName={user.name || user.email}
      initialAchievements={achievements}
    />
  )
}
