import type { Metadata } from "next"

import { AdminBulkEmail } from "@/components/admin/email/admin-bulk-email"

export const metadata: Metadata = {
  title: "Bulk Mailer | DPI Computing Society",
}

export default function AdminBulkEmailPage() {
  return <AdminBulkEmail />
}
