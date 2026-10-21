import type { Metadata } from "next"

import { AdminUsersView } from "@/components/admin/admin-users-view"
import { getUserRoles } from "@/lib/roles"
import { DEFAULT_USER_PAGE_SIZE, listUsers } from "@/lib/services/user.service"
import { getSession } from "@/lib/session"
import prisma from "@/lib/prisma"
import { InvitationStatus } from "@/generated/prisma/enums"

export const metadata: Metadata = {
  title: "Users & Invitations",
}

export default async function AdminUsersPage() {
  const [session, data, pendingInvitesCount] = await Promise.all([
    getSession(),
    listUsers({
      search: null,
      role: null,
      page: 1,
      pageSize: DEFAULT_USER_PAGE_SIZE,
    }),
    prisma.invitation.count({
      where: {
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
    }),
  ])

  const currentUserRoles = getUserRoles(session?.user)

  return (
    <AdminUsersView
      initialUsersData={data}
      currentUserRoles={currentUserRoles}
      pendingInvitationsCount={pendingInvitesCount}
    />
  )
}
