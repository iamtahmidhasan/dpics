import type { Metadata } from "next"

import { AdminSmtpSettings } from "@/components/admin/email/admin-smtp-settings"

export const metadata: Metadata = {
  title: "SMTP Settings | DPI Computing Society",
}

export default function AdminSmtpSettingsPage() {
  return <AdminSmtpSettings />
}
