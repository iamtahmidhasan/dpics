import type { Metadata } from "next"

import { AdminUserMemberTab } from "@/components/admin/user-detail/admin-user-member-tab"

export const metadata: Metadata = {
  title: "Membership | User Details",
}

export default function AdminUserMemberPage() {
  return <AdminUserMemberTab />
}
