import type { Metadata } from "next"

import { AdminUserOverviewTab } from "@/components/admin/user-detail/admin-user-overview-tab"

export const metadata: Metadata = {
  title: "Overview | User Details",
}

export default function AdminUserOverviewPage() {
  return <AdminUserOverviewTab />
}
