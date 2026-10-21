import type { Metadata } from "next"

import { AdminEmailLogs } from "@/components/admin/email/admin-email-logs"

export const metadata: Metadata = {
  title: "Delivery Logs | DPI Computing Society",
}

export default function AdminEmailLogsPage() {
  return <AdminEmailLogs />
}
