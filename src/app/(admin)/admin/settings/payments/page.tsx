import type { Metadata } from "next"

import { AdminPaymentsTab } from "@/components/admin/settings/admin-payments-tab"

export const metadata: Metadata = {
  title: "Payments Settings",
}

export default function PaymentsSettingsPage() {
  return <AdminPaymentsTab />
}
