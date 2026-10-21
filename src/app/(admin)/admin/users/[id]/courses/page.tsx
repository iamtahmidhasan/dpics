import type { Metadata } from "next"

import { AdminUserCoursesTab } from "@/components/admin/user-detail/admin-user-courses-tab"

export const metadata: Metadata = {
  title: "Enrolled Courses | User Details",
}

export default function AdminUserCoursesPage() {
  return <AdminUserCoursesTab />
}
