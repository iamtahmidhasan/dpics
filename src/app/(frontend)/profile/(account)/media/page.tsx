import type { Metadata } from "next"

import { UserMediaManager } from "@/components/profile/user-media-manager"
import { getMediaStats, listMedia } from "@/lib/services/media.service"
import { isAdmin, requireMediaAccess } from "@/lib/session"

export const metadata: Metadata = {
  title: "My Uploaded Media | DPI Computing Society",
}

export default async function ProfileMediaPage() {
  const session = await requireMediaAccess()

  const [items, stats] = await Promise.all([
    listMedia({ userId: session.user.id, limit: 150 }),
    getMediaStats(session.user.id),
  ])

  return (
    <UserMediaManager
      initialItems={items}
      initialStats={stats}
      canDelete={isAdmin(session.user)}
    />
  )
}
