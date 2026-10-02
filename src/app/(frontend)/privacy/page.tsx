import type { Metadata } from "next"

import { PrivacyContent } from "@/components/privacy/privacy-content"
import { SITE_NAME } from "@/lib/site"

export const metadata: Metadata = {
  title: `Privacy Policy | ${SITE_NAME}`,
  description:
    "Privacy Policy and data protection terms for members, students, and visitors of the DPI Computing Society (DPICS).",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: `Privacy Policy | ${SITE_NAME}`,
    description:
      "Understand how DPI Computing Society collects, handles, and protects your personal and academic data.",
    url: "/privacy",
    siteName: SITE_NAME,
    type: "website",
  },
}

export default function PrivacyPage() {
  return <PrivacyContent />
}
