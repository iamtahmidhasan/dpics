import type { Metadata } from "next"

import { AdminSignupsTab } from "@/components/admin/settings/admin-signups-tab"

export const metadata: Metadata = {
  title: "Signups & Access Settings",
}

export default function SignupsSettingsPage() {
  return <AdminSignupsTab />
}
