import "server-only"

import prisma from "@/lib/prisma"
import { resolveUserImage, normalizeImageList } from "@/lib/user-image"
import {
  Department,
  InstructorStatus,
  MembershipStatus,
  Role,
  Semester,
  Shift,
  VerificationStatus,
} from "@/generated/prisma/enums"

export type PublicMemberInfo = {
  id: string
  studentId: string | null
  department: Department
  session: string
  semester: Semester
  shift: Shift
  status: MembershipStatus
  verificationStatus: VerificationStatus
  joinedAt: string | null
}

export type PublicInstructorInfo = {
  id: string
  instructorId: string | null
  bio: string | null
  expertise: string | null
  status: InstructorStatus
}

export type PublicCommitteeRole = {
  id: string
  roleName: string
  roleSlug: string
  committeeName: string
  committeeSlug: string
  isActive: boolean
  startDate: string | null
  endDate: string | null
}

export type PublicPostItem = {
  id: string
  title: string
  titleBn: string | null
  slug: string
  excerpt: string | null
  excerptBn: string | null
  coverImage: string | null
  categoryName: string | null
  categorySlug: string | null
  tags: string[]
  readingMinutes: number
  publishedAt: string
}

export type PublicCourseItem = {
  id: string
  title: string
  titleBn: string | null
  slug: string
  thumbnail: string | null
  level: string
  isFree: boolean
  role: string | null
  totalLessons: number
  studentsCount: number
}

export type PublicEnrollmentItem = {
  id: string
  courseTitle: string
  courseTitleBn: string | null
  courseSlug: string
  courseThumbnail: string | null
  level: string
  enrolledAt: string
  completedLessonsCount: number
  totalLessonsCount: number
  isCompleted: boolean
}

export type ActivityItem = {
  id: string
  type: "JOINED" | "POST" | "COURSE_TEACHING" | "COURSE_COMPLETED" | "COMMITTEE"
  title: string
  titleBn?: string | null
  description?: string | null
  timestamp: string
  link?: string | null
}

export type PublicProfile = {
  id: string
  name: string
  avatar: string | null
  roles: Role[]
  createdAt: string
  isMember: boolean
  isInstructor: boolean
  isAdmin: boolean
  member: PublicMemberInfo | null
  instructor: PublicInstructorInfo | null
  committeeRoles: PublicCommitteeRole[]
  posts: PublicPostItem[]
  instructedCourses: PublicCourseItem[]
  enrolledCourses: PublicEnrollmentItem[]
  activities: ActivityItem[]
  stats: {
    postsCount: number
    coursesInstructedCount: number
    coursesCompletedCount: number
    committeeRolesCount: number
  }
}

export type MemberListItem = {
  id: string
  userId: string
  name: string
  avatar: string | null
  studentId: string | null
  department: Department
  session: string
  semester: Semester
  shift: Shift
  joinedAt: string | null
  roles: Role[]
  isInstructor: boolean
  committeeRolesCount: number
  postsCount: number
}

export type InstructorListItem = {
  id: string
  userId: string
  name: string
  avatar: string | null
  instructorId: string | null
  expertise: string | null
  bio: string | null
  coursesCount: number
  postsCount: number
  isMember: boolean
}

export const PublicProfileService = {
  /**
   * Resolves a public profile by any identifier:
   * User ID, Member ID, Instructor ID, Student ID, or Instructor ID code.
   */
  async getProfileByIdentifier(identifier: string): Promise<PublicProfile | null> {
    if (!identifier || typeof identifier !== "string") return null
    const trimmed = identifier.trim()

    const user = await prisma.user.findFirst({
      where: {
        isActive: true,
        OR: [
          { id: trimmed },
          { member: { is: { id: trimmed } } },
          { member: { is: { studentId: trimmed } } },
          { instructor: { is: { id: trimmed } } },
          { instructor: { is: { instructorId: trimmed } } },
        ],
      },
      include: {
        member: true,
        instructor: {
          include: {
            lessonInstructors: {
              include: {
                lesson: {
                  include: {
                    section: {
                      include: {
                        course: {
                          include: {
                            _count: {
                              select: {
                                enrollments: { where: { status: "ACTIVE" } },
                              },
                            },
                            sections: {
                              include: {
                                _count: {
                                  select: { lessons: true },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        committeeRoles: {
          include: {
            role: {
              include: {
                committee: true,
              },
            },
          },
          orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
        },
        posts: {
          where: { status: "PUBLISHED" },
          orderBy: { publishedAt: "desc" },
          include: {
            category: true,
          },
        },
        courseEnrollments: {
          where: { status: "ACTIVE" },
          orderBy: { enrolledAt: "desc" },
          include: {
            course: {
              include: {
                sections: {
                  include: {
                    lessons: {
                      select: { id: true },
                    },
                  },
                },
              },
            },
          },
        },
        lessonProgress: {
          where: { completed: true },
          select: { lessonId: true },
        },
      },
    })

    if (!user) return null

    const { avatar } = resolveUserImage(
      normalizeImageList(user.image),
      user.selactedImg
    )

    const isMember = Boolean(user.member && user.member.status === MembershipStatus.ACTIVE)
    const isInstructor = Boolean(user.instructor && user.instructor.status === InstructorStatus.ACTIVE)
    const isAdmin = user.roles.includes(Role.ADMIN)

    // Format Member Profile (Private documents and payment details deliberately omitted)
    const member: PublicMemberInfo | null = user.member
      ? {
          id: user.member.id,
          studentId: user.member.studentId,
          department: user.member.department,
          session: user.member.session,
          semester: user.member.semester,
          shift: user.member.shift,
          status: user.member.status,
          verificationStatus: user.member.verificationStatus,
          joinedAt: user.member.joinedAt ? user.member.joinedAt.toISOString() : null,
        }
      : null

    // Format Instructor Profile
    const instructor: PublicInstructorInfo | null = user.instructor
      ? {
          id: user.instructor.id,
          instructorId: user.instructor.instructorId,
          bio: user.instructor.bio,
          expertise: user.instructor.expertise,
          status: user.instructor.status,
        }
      : null

    // Format Committee Roles
    const committeeRoles: PublicCommitteeRole[] = user.committeeRoles.map((cr) => ({
      id: cr.id,
      roleName: cr.role.name,
      roleSlug: cr.role.slug,
      committeeName: cr.role.committee.name,
      committeeSlug: cr.role.committee.slug,
      isActive: cr.isActive,
      startDate: cr.startDate ? cr.startDate.toISOString() : null,
      endDate: cr.endDate ? cr.endDate.toISOString() : null,
    }))

    // Format Published Posts
    const posts: PublicPostItem[] = user.posts.map((p) => ({
      id: p.id,
      title: p.title,
      titleBn: p.titleBn,
      slug: p.slug,
      excerpt: p.excerpt,
      excerptBn: p.excerptBn,
      coverImage: p.coverImage,
      categoryName: p.category?.name || null,
      categorySlug: p.category?.slug || null,
      tags: p.tags || [],
      readingMinutes: p.readingMinutes || 1,
      publishedAt: (p.publishedAt || p.createdAt).toISOString(),
    }))

    // Format Instructed Courses (Deduplicate courses from lessonInstructors)
    const courseMap = new Map<string, PublicCourseItem>()
    if (user.instructor?.lessonInstructors) {
      for (const li of user.instructor.lessonInstructors) {
        const c = li.lesson.section.course
        if (!c.isPublished) continue
        if (!courseMap.has(c.id)) {
          const totalLessons = c.sections.reduce(
            (acc, s) => acc + (s._count?.lessons || 0),
            0
          )
          courseMap.set(c.id, {
            id: c.id,
            title: c.title,
            titleBn: c.titleBn,
            slug: c.slug,
            thumbnail: c.thumbnail,
            level: c.level,
            isFree: c.isFree,
            role: li.role || "Instructor",
            totalLessons,
            studentsCount: c._count?.enrollments || 0,
          })
        }
      }
    }
    const instructedCourses = Array.from(courseMap.values())

    // Format Enrolled Courses & Progress
    const completedLessonIds = new Set(user.lessonProgress.map((lp) => lp.lessonId))
    const enrolledCourses: PublicEnrollmentItem[] = user.courseEnrollments.map((e) => {
      const allLessons = e.course.sections.flatMap((s) => s.lessons)
      const totalLessonsCount = allLessons.length
      const completedLessonsCount = allLessons.filter((l) => completedLessonIds.has(l.id)).length
      const isCompleted = totalLessonsCount > 0 && completedLessonsCount >= totalLessonsCount

      return {
        id: e.id,
        courseTitle: e.course.title,
        courseTitleBn: e.course.titleBn,
        courseSlug: e.course.slug,
        courseThumbnail: e.course.thumbnail,
        level: e.course.level,
        enrolledAt: e.enrolledAt.toISOString(),
        completedLessonsCount,
        totalLessonsCount,
        isCompleted,
      }
    })

    // Synthesize Chronological Activity Timeline
    const activities: ActivityItem[] = []

    // 1. Membership / Joined Society
    if (user.member?.joinedAt || user.createdAt) {
      activities.push({
        id: `act-joined-${user.id}`,
        type: "JOINED",
        title: "Joined DPI Computing Society",
        titleBn: "ডিপিআই কম্পিউটিং সোসাইটিতে যোগদান করেছেন",
        description: member?.department ? `Student at ${member.department.replace(/_/g, " ")}` : "Registered as an official member",
        timestamp: (user.member?.joinedAt || user.createdAt).toISOString(),
      })
    }

    // 2. Published Posts
    for (const post of user.posts) {
      activities.push({
        id: `act-post-${post.id}`,
        type: "POST",
        title: `Published article: "${post.title}"`,
        titleBn: post.titleBn ? `নিবন্ধ প্রকাশ করেছেন: "${post.titleBn}"` : `নিবন্ধ প্রকাশ করেছেন: "${post.title}"`,
        description: post.excerpt || post.category?.name || "Technical writing & community insights",
        timestamp: (post.publishedAt || post.createdAt).toISOString(),
        link: `/posts/${post.slug}`,
      })
    }

    // 3. Courses Teaching
    for (const course of instructedCourses) {
      activities.push({
        id: `act-course-${course.id}`,
        type: "COURSE_TEACHING",
        title: `Course Instructor: "${course.title}"`,
        titleBn: course.titleBn ? `কোর্স ইনস্ট্রাক্টর: "${course.titleBn}"` : `কোর্স ইনস্ট্রাক্টর: "${course.title}"`,
        description: `${course.studentsCount} active students enrolled • ${course.totalLessons} lessons`,
        timestamp: user.createdAt.toISOString(),
        link: `/courses/${course.slug}`,
      })
    }

    // 4. Completed Courses
    for (const enrollment of enrolledCourses) {
      if (enrollment.isCompleted) {
        activities.push({
          id: `act-completed-${enrollment.id}`,
          type: "COURSE_COMPLETED",
          title: `Completed Course: "${enrollment.courseTitle}"`,
          titleBn: enrollment.courseTitleBn ? `কোর্স সম্পন্ন করেছেন: "${enrollment.courseTitleBn}"` : `কোর্স সম্পন্ন করেছেন: "${enrollment.courseTitle}"`,
          description: `All ${enrollment.totalLessonsCount} lessons finished successfully`,
          timestamp: enrollment.enrolledAt,
          link: `/courses/${enrollment.courseSlug}`,
        })
      }
    }

    // 5. Committee Appointments
    for (const cr of committeeRoles) {
      activities.push({
        id: `act-committee-${cr.id}`,
        type: "COMMITTEE",
        title: `Designation: ${cr.roleName} (${cr.committeeName})`,
        titleBn: `দায়িত্বপ্রাপ্ত: ${cr.roleName} (${cr.committeeName})`,
        description: cr.isActive ? "Currently serving in active tenure" : "Completed honorable term",
        timestamp: cr.startDate || user.createdAt.toISOString(),
        link: `/committee#${cr.committeeSlug}`,
      })
    }

    // Sort activities descending by timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return {
      id: user.id,
      name: user.name,
      avatar,
      roles: user.roles,
      createdAt: user.createdAt.toISOString(),
      isMember,
      isInstructor,
      isAdmin,
      member,
      instructor,
      committeeRoles,
      posts,
      instructedCourses,
      enrolledCourses,
      activities,
      stats: {
        postsCount: posts.length,
        coursesInstructedCount: instructedCourses.length,
        coursesCompletedCount: enrolledCourses.filter((e) => e.isCompleted).length,
        committeeRolesCount: committeeRoles.length,
      },
    }
  },

  /**
   * Lists public active members with search, filters, and pagination.
   */
  async listMembers(params: {
    search?: string
    department?: Department
    session?: string
    semester?: Semester
    page?: number
    pageSize?: number
  }) {
    const page = Math.max(1, params.page || 1)
    const pageSize = Math.min(60, Math.max(1, params.pageSize || 16))
    const skip = (page - 1) * pageSize

    const memberWhere: any = {
      status: MembershipStatus.ACTIVE,
    }

    if (params.department) {
      memberWhere.department = params.department
    }

    if (params.session) {
      memberWhere.session = params.session
    }

    if (params.semester) {
      memberWhere.semester = params.semester
    }

    const where: any = {
      isActive: true,
      member: {
        is: memberWhere,
      },
    }

    if (params.search && params.search.trim().length > 0) {
      const q = params.search.trim()
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { member: { is: { studentId: { contains: q, mode: "insensitive" } } } },
        { member: { is: { session: { contains: q, mode: "insensitive" } } } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: [
          { member: { joinedAt: "desc" } },
          { createdAt: "desc" },
        ],
        skip,
        take: pageSize,
        include: {
          member: true,
          instructor: {
            select: { id: true, status: true },
          },
          _count: {
            select: {
              posts: { where: { status: "PUBLISHED" } },
              committeeRoles: { where: { isActive: true } },
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ])

    const members: MemberListItem[] = users.map((u) => {
      const { avatar } = resolveUserImage(
        normalizeImageList(u.image),
        u.selactedImg
      )

      return {
        id: u.member!.id,
        userId: u.id,
        name: u.name,
        avatar,
        studentId: u.member!.studentId,
        department: u.member!.department,
        session: u.member!.session,
        semester: u.member!.semester,
        shift: u.member!.shift,
        joinedAt: u.member!.joinedAt ? u.member!.joinedAt.toISOString() : null,
        roles: u.roles,
        isInstructor: Boolean(u.instructor && u.instructor.status === InstructorStatus.ACTIVE),
        committeeRolesCount: u._count.committeeRoles,
        postsCount: u._count.posts,
      }
    })

    return {
      members,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    }
  },

  /**
   * Lists public active instructors with course stats.
   */
  async listInstructors(params: {
    search?: string
    page?: number
    pageSize?: number
  }) {
    const page = Math.max(1, params.page || 1)
    const pageSize = Math.min(60, Math.max(1, params.pageSize || 16))
    const skip = (page - 1) * pageSize

    const where: any = {
      isActive: true,
      instructor: {
        is: {
          status: InstructorStatus.ACTIVE,
        },
      },
    }

    if (params.search && params.search.trim().length > 0) {
      const q = params.search.trim()
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { instructor: { is: { expertise: { contains: q, mode: "insensitive" } } } },
        { instructor: { is: { bio: { contains: q, mode: "insensitive" } } } },
        { instructor: { is: { instructorId: { contains: q, mode: "insensitive" } } } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        skip,
        take: pageSize,
        include: {
          instructor: {
            include: {
              lessonInstructors: {
                select: {
                  lesson: {
                    select: {
                      section: {
                        select: {
                          courseId: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          member: {
            select: { id: true, status: true },
          },
          _count: {
            select: {
              posts: { where: { status: "PUBLISHED" } },
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ])

    const instructors: InstructorListItem[] = users.map((u) => {
      const { avatar } = resolveUserImage(
        normalizeImageList(u.image),
        u.selactedImg
      )

      // Count unique courses taught
      const uniqueCourseIds = new Set<string>()
      if (u.instructor?.lessonInstructors) {
        for (const li of u.instructor.lessonInstructors) {
          if (li.lesson?.section?.courseId) {
            uniqueCourseIds.add(li.lesson.section.courseId)
          }
        }
      }

      return {
        id: u.instructor!.id,
        userId: u.id,
        name: u.name,
        avatar,
        instructorId: u.instructor!.instructorId,
        expertise: u.instructor!.expertise,
        bio: u.instructor!.bio,
        coursesCount: uniqueCourseIds.size,
        postsCount: u._count.posts,
        isMember: Boolean(u.member && u.member.status === MembershipStatus.ACTIVE),
      }
    })

    return {
      instructors,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    }
  },
}
