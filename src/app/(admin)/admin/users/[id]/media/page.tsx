import type { Metadata } from "next"

import { AdminUserMediaTab } from "@/components/admin/user-detail/admin-user-media-tab"

export const metadata: Metadata = {
  title: "Media & Documents | User Details",
}

export default function AdminUserMediaPage() {
  return <AdminUserMediaTab />
}
