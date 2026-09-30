import { ProfileSidebar } from "@/components/profile/profile-sidebar"
import { getUserRoles, requireUser } from "@/lib/session"

export default async function ProfileLayout({ children }: LayoutProps<"/profile">) {
  const session = await requireUser()
  const roles = getUserRoles(session.user)

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 md:flex-row md:px-8">
      <ProfileSidebar roles={roles} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
