import type { Metadata } from "next"

import { ProfileSidebar } from "@/components/profile/profile-sidebar"
import { getUserRoles, requireUser } from "@/lib/session"
import { NOINDEX } from "@/lib/seo"

// Auth-gated account screens — never index them, even though their public
// counterparts under /profile/[id] are.
export const metadata: Metadata = { robots: NOINDEX }

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireUser()
  const roles = getUserRoles(session.user)

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 md:flex-row md:px-8">
      <ProfileSidebar roles={roles} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
