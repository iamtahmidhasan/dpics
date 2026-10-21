import type { Metadata } from "next"

import { AdminUserPostsTab } from "@/components/admin/user-detail/admin-user-posts-tab"

export const metadata: Metadata = {
  title: "Posts & Articles | User Details",
}

export default function AdminUserPostsPage() {
  return <AdminUserPostsTab />
}
