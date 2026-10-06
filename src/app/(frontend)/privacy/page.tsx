import type { Metadata } from "next"

import { PrivacyContent } from "@/components/privacy/privacy-content"
import { websiteMetadata } from "@/lib/seo"

const DESCRIPTION =
  "Privacy Policy and data protection terms for members, students, and visitors of the DPI Computing Society (DPICS)."

export const metadata: Metadata = websiteMetadata({
  title: "Privacy Policy | DPI Computing Society",
  description: DESCRIPTION,
  path: "/privacy",
})

export default function PrivacyPage() {
  return <PrivacyContent />
}
