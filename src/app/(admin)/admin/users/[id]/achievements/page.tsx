import type { Metadata } from "next"

import { AdminUserAchievementsTab } from "@/components/admin/user-detail/admin-user-achievements-tab"

export const metadata: Metadata = {
  title: "Achievements | User Details",
}

export default function AdminUserAchievementsPage() {
  return <AdminUserAchievementsTab />
}
