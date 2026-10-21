import type { Metadata } from "next"

import { AdminUserInstructorTab } from "@/components/admin/user-detail/admin-user-instructor-tab"

export const metadata: Metadata = {
  title: "Instructor Profile | User Details",
}

export default function AdminUserInstructorPage() {
  return <AdminUserInstructorTab />
}
