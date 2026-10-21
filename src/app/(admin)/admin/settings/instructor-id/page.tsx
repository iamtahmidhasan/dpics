import type { Metadata } from "next"

import { AdminInstructorIdTab } from "@/components/admin/settings/admin-instructor-id-tab"

export const metadata: Metadata = {
  title: "Instructor ID Settings",
}

export default function InstructorIdSettingsPage() {
  return <AdminInstructorIdTab />
}
