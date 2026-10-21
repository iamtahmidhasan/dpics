import type { Metadata } from "next"

import { AdminUserAccountTab } from "@/components/admin/user-detail/admin-user-account-tab"

export const metadata: Metadata = {
  title: "Account Details | User Details",
}

export default function AdminUserAccountPage() {
  return <AdminUserAccountTab />
}
