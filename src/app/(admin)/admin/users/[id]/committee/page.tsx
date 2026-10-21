import type { Metadata } from "next"

import { AdminUserCommitteeTab } from "@/components/admin/user-detail/admin-user-committee-tab"

export const metadata: Metadata = {
  title: "Committee Roles | User Details",
}

export default function AdminUserCommitteePage() {
  return <AdminUserCommitteeTab />
}
