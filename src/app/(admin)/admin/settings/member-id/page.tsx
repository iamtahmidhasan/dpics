import type { Metadata } from "next"

import { AdminMemberIdTab } from "@/components/admin/settings/admin-member-id-tab"

export const metadata: Metadata = {
  title: "Student ID & Batch Settings",
}

export default function MemberIdSettingsPage() {
  return <AdminMemberIdTab />
}
