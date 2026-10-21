import type { Metadata } from "next"

import { AdminUserProjectsTab } from "@/components/admin/user-detail/admin-user-projects-tab"

export const metadata: Metadata = {
  title: "Projects & Showcases | User Details",
}

export default function AdminUserProjectsPage() {
  return <AdminUserProjectsTab />
}
