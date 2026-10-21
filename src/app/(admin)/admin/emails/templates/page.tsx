import type { Metadata } from "next"
import { Suspense } from "react"

import { AdminEmailTemplates } from "@/components/admin/email/admin-email-templates"
import { Spinner } from "@/components/ui/spinner"

export const metadata: Metadata = {
  title: "Email Templates | DPI Computing Society",
}

export default function AdminEmailTemplatesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-48 items-center justify-center">
          <Spinner className="size-6 text-primary" />
        </div>
      }
    >
      <AdminEmailTemplates />
    </Suspense>
  )
}
