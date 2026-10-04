import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { AdminUserDetailView } from "@/components/admin/admin-user-detail"
import { ApiError } from "@/lib/api-error"
import prisma from "@/lib/prisma"
import { getAdminUserDetail } from "@/lib/services/admin-user.service"
import { EnrollmentService } from "@/lib/services/enrollment.service"
import { listPostsForAdmin } from "@/lib/services/post.service"
import { listAchievementsForAdmin } from "@/lib/services/achievement.service"
import { requireAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: "User",
}

export default async function AdminUserDetailPage({ params }: PageProps<"/admin/users/[id]">) {
  const session = await requireAdmin()
  const { id } = await params

  let user
  let posts
  let achievements
  let enrollments
  let courses
  try {
    const [fetchedUser, fetchedPosts, fetchedAchievements, fetchedEnrollments, availableCourses] = await Promise.all([
      getAdminUserDetail(id),
      listPostsForAdmin({ authorId: id }),
      listAchievementsForAdmin({ authorId: id }),
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
    ])
    user = fetchedUser
    posts = fetchedPosts
    achievements = fetchedAchievements
    enrollments = JSON.parse(JSON.stringify(fetchedEnrollments))
    courses = JSON.parse(JSON.stringify(availableCourses))
  } catch (error) {
    // A missing user is a 404 page; anything else is a real failure.
    if (error instanceof ApiError && error.status === 404) notFound()

    throw error
  }

  return (
    <AdminUserDetailView
      initialUser={user}
      initialPosts={posts}
      initialAchievements={achievements}
      initialEnrollments={enrollments}
      availableCourses={courses}
      isSelf={user.id === session.user.id}
    />
  )
}