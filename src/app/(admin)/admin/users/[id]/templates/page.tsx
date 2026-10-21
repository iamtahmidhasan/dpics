import type { Metadata } from "next"

import { AdminUserTemplatesTab } from "@/components/admin/user-detail/admin-user-templates-tab"

export const metadata: Metadata = {
  title: "Cards & Templates | User Details",
}

export default function AdminUserTemplatesPage() {
  return <AdminUserTemplatesTab />
}
