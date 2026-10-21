import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { AdminUserHeader } from "@/components/admin/user-detail/admin-user-header"
import { AdminUserProvider } from "@/components/admin/user-detail/admin-user-context"
import { AdminUserTabs } from "@/components/admin/user-detail/admin-user-tabs"
import { ApiError } from "@/lib/api-error"
import prisma from "@/lib/prisma"
import { getAdminUserDetail } from "@/lib/services/admin-user.service"
import { EnrollmentService } from "@/lib/services/enrollment.service"
import { listPostsForAdmin } from "@/lib/services/post.service"
import { listAchievementsForAdmin } from "@/lib/services/achievement.service"
import { listUserTemplateAssignments } from "@/lib/services/media-template-assignment.service"
import { listMediaTemplates } from "@/lib/services/media-template.service"
import { ProjectService } from "@/lib/services/project.service"
import { isSuperAdmin } from "@/lib/roles"
import { requireAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: "User Details",
}

export default async function AdminUserDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const session = await requireAdmin()
  const isActorSuperAdmin = isSuperAdmin(session.user)
  const { id } = await params

  let user
  let posts
  let achievements
  let projects
  let enrollments
  let courses
  let templateAssignments
  let availableTemplates

  try {
    const [
      fetchedUser,
      fetchedPosts,
      fetchedAchievements,
      fetchedProjects,
      fetchedEnrollments,
      availableCourses,
      fetchedAssignments,
      fetchedTemplates,
    ] = await Promise.all([
      getAdminUserDetail(id),
      listPostsForAdmin({ authorId: id }),
      listAchievementsForAdmin({ authorId: id }),
      ProjectService.listAdminProjects({ authorId: id, pageSize: 20 }),
      EnrollmentService.listUserEnrollments(id),
      prisma.course.findMany({
        select: {
          id: true,
          title: true,
          slug: true,
          isFree: true,
          price: true,
          discountPrice: true,
        },
        orderBy: { title: "asc" },
      }),
      listUserTemplateAssignments(id),
      listMediaTemplates({ isActiveOnly: true }),
    ])
    user = fetchedUser
    posts = fetchedPosts
    achievements = fetchedAchievements
    projects = JSON.parse(JSON.stringify(fetchedProjects))
    enrollments = JSON.parse(JSON.stringify(fetchedEnrollments))
    courses = JSON.parse(JSON.stringify(availableCourses))
    templateAssignments = JSON.parse(JSON.stringify(fetchedAssignments))
    availableTemplates = JSON.parse(JSON.stringify(fetchedTemplates))
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound()
    throw error
  }

  const isSelf = session.user.id === user.id

  return (
    <AdminUserProvider
      initialUser={user}
      initialPosts={posts}
      initialAchievements={achievements}
      initialProjects={projects}
      initialEnrollments={enrollments}
      availableCourses={courses}
      initialTemplateAssignments={templateAssignments}
      availableTemplates={availableTemplates}
      isSelf={isSelf}
      isActorSuperAdmin={isActorSuperAdmin}
    >
      <div className="space-y-4">
        {/* Desktop User Header (>= md) */}
        <AdminUserHeader className="hidden md:flex" />

        {/* Desktop Horizontal Tabs (>= md) */}
        <AdminUserTabs />

        {/* Page / Subpage content */}
        <div>{children}</div>
      </div>
    </AdminUserProvider>
  )
}
