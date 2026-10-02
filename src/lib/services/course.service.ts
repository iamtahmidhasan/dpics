import "server-only"

import prisma from "@/lib/prisma"
import type { CourseLevel } from "@/generated/prisma/enums"

export interface CreateCourseInput {
  title: string
  slug: string
  excerpt?: string | null
  description?: string | null
  thumbnail?: string | null
  level?: CourseLevel
  isFree?: boolean
  price?: number
  discountPrice?: number | null
  isPublished?: boolean
  featured?: boolean
  tags?: string[]
}

export interface UpdateCourseInput extends Partial<CreateCourseInput> {}

export interface LessonInstructorInput {
  instructorId: string
  role?: string
}

export interface LessonInput {
  id?: string
  title: string
  description?: string | null
  orderIndex: number
  isPreview?: boolean
  videoUrl?: string | null
  videoDuration?: string | null
  liveClass?: any
  documents?: any
  quiz?: any
  assignment?: any
  resources?: any
  externalLinks?: any
  instructorIds?: LessonInstructorInput[]
}

export interface SectionInput {
  id?: string
  title: string
  description?: string | null
  orderIndex: number
  lessons: LessonInput[]
}

export class CourseService {
  /**
   * List courses for catalog or admin
   */
  static async listCourses(params?: {
    isPublished?: boolean
    isFree?: boolean
    search?: string
    level?: CourseLevel
    tag?: string
  }) {
    const { isPublished, isFree, search, level, tag } = params || {}

    const where: any = {}

    if (typeof isPublished === "boolean") {
      where.isPublished = isPublished
    }

    if (typeof isFree === "boolean") {
      where.isFree = isFree
    }

    if (level) {
      where.level = level
    }

    if (tag) {
      where.tags = { has: tag }
    }

    if (search && search.trim().length > 0) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
        { tags: { has: search.trim() } },
      ]
    }

    const courses = await prisma.course.findMany({
      where,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      include: {
        sections: {
          orderBy: { orderIndex: "asc" },
          include: {
            lessons: {
              select: {
                id: true,
                title: true,
                videoDuration: true,
                isPreview: true,
                instructors: {
                  include: {
                    instructor: {
                      include: {
                        user: {
                          select: {
                            id: true,
                            name: true,
                            image: true,
                            selactedImg: true,
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
        _count: {
          select: {
            enrollments: {
              where: { status: "ACTIVE" },
            },
          },
        },
      },
    })

    return courses.map((c) => {
      const totalLessons = c.sections.reduce((acc, s) => acc + s.lessons.length, 0)
      // Extract unique instructors across all lessons
      const instructorsMap = new Map<string, any>()
      for (const section of c.sections) {
        for (const lesson of section.lessons) {
          for (const li of lesson.instructors) {
            if (li.instructor?.user && !instructorsMap.has(li.instructor.id)) {
              instructorsMap.set(li.instructor.id, {
                id: li.instructor.id,
                name: li.instructor.user.name,
                image: li.instructor.user.image,
                selactedImg: li.instructor.user.selactedImg,
                role: li.role,
              })
            }
          }
        }
      }

      return {
        ...c,
        totalLessons,
        totalSections: c.sections.length,
        instructors: Array.from(instructorsMap.values()),
      }
    })
  }

  /**
   * Get single course by slug with student access verification
   */
  static async getCourseBySlug(slug: string, userId?: string | null, isAdmin = false) {
    const course = await prisma.course.findUnique({
      where: { slug },
      include: {
        sections: {
          orderBy: { orderIndex: "asc" },
          include: {
            lessons: {
              orderBy: { orderIndex: "asc" },
              include: {
                instructors: {
                  include: {
                    instructor: {
                      include: {
                        user: {
                          select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true,
                            selactedImg: true,
                          },
                        },
                      },
                    },
                  },
                },
                progress: {
                  where: { userId: userId || "" },
                },
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: {
              where: { status: "ACTIVE" },
            },
          },
        },
      },
    })

    if (!course) return null

    // Check user enrollment
    let enrollment: { status: string; id: string } | null = null
    if (userId) {
      const found = await prisma.courseEnrollment.findUnique({
        where: {
          courseId_userId: {
            courseId: course.id,
            userId,
          },
        },
        select: { id: true, status: true },
      })
      if (found) {
        enrollment = found
      }
    }

    const hasAccess = isAdmin || enrollment?.status === "ACTIVE"

    // Sanitize lessons if user does not have active access
    const sanitizedSections = course.sections.map((section) => ({
      ...section,
      lessons: section.lessons.map((lesson) => {
        const isUnlocked = hasAccess || lesson.isPreview

        return {
          id: lesson.id,
          sectionId: lesson.sectionId,
          title: lesson.title,
          description: isUnlocked ? lesson.description : null,
          orderIndex: lesson.orderIndex,
          isPreview: lesson.isPreview,
          videoDuration: lesson.videoDuration,
          isUnlocked,
          // Only reveal full resources if unlocked
          videoUrl: isUnlocked ? lesson.videoUrl : null,
          liveClass: isUnlocked ? lesson.liveClass : null,
          documents: isUnlocked ? lesson.documents : null,
          quiz: isUnlocked ? lesson.quiz : null,
          assignment: isUnlocked ? lesson.assignment : null,
          resources: isUnlocked ? lesson.resources : null,
          externalLinks: isUnlocked ? lesson.externalLinks : null,
          instructors: lesson.instructors.map((li) => ({
            id: li.id,
            instructorId: li.instructorId,
            role: li.role,
            name: li.instructor.user.name,
            email: li.instructor.user.email,
            image: Array.isArray(li.instructor.user.image)
              ? li.instructor.user.image[0]
              : li.instructor.user.image,
            selactedImg: li.instructor.user.selactedImg,
            expertise: li.instructor.expertise || null,
            bio: li.instructor.bio || null,
          })),
          isCompleted: Array.isArray(lesson.progress) && lesson.progress.length > 0 ? lesson.progress[0].completed : false,
        }
      }),
    }))

    // Calculate overall course progress if user is logged in
    let completedLessonsCount = 0
    let totalLessonsCount = 0
    for (const s of sanitizedSections) {
      for (const l of s.lessons) {
        totalLessonsCount++
        if (l.isCompleted) completedLessonsCount++
      }
    }

    const progressPercentage =
      totalLessonsCount > 0 ? Math.round((completedLessonsCount / totalLessonsCount) * 100) : 0

    return {
      ...course,
      sections: sanitizedSections,
      enrollment,
      hasAccess,
      stats: {
        totalLessons: totalLessonsCount,
        completedLessons: completedLessonsCount,
        progressPercentage,
      },
    }
  }

  /**
   * Admin: Get course by ID with complete unmasked curriculum
   */
  static async getCourseAdminById(id: string) {
    return prisma.course.findUnique({
      where: { id },
      include: {
        sections: {
          orderBy: { orderIndex: "asc" },
          include: {
            lessons: {
              orderBy: { orderIndex: "asc" },
              include: {
                instructors: {
                  include: {
                    instructor: {
                      include: {
                        user: {
                          select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true,
                            selactedImg: true,
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
    })
  }

  /**
   * Create course
   */
  static async createCourse(data: CreateCourseInput, createdById?: string) {
    return prisma.course.create({
      data: {
        title: data.title.trim(),
        slug: data.slug.trim().toLowerCase(),
        excerpt: data.excerpt?.trim() || null,
        description: data.description?.trim() || null,
        thumbnail: data.thumbnail?.trim() || null,
        level: data.level || "ALL_LEVELS",
        isFree: data.isFree ?? true,
        price: data.isFree ? 0 : data.price || 0,
        discountPrice: data.discountPrice || null,
        isPublished: data.isPublished ?? false,
        featured: data.featured ?? false,
        tags: data.tags || [],
        createdById,
      },
    })
  }

  /**
   * Update course
   */
  static async updateCourse(id: string, data: UpdateCourseInput) {
    const updateData: any = { ...data }
    if (updateData.title) updateData.title = updateData.title.trim()
    if (updateData.slug) updateData.slug = updateData.slug.trim().toLowerCase()
    if (updateData.isFree) {
      updateData.price = 0
      updateData.discountPrice = null
    }

    return prisma.course.update({
      where: { id },
      data: updateData,
    })
  }

  /**
   * Delete course
   */
  static async deleteCourse(id: string) {
    return prisma.course.delete({
      where: { id },
    })
  }

  /**
   * Save entire curriculum (sections, lessons, multi-instructor relations)
   */
  static async saveCurriculum(courseId: string, sections: SectionInput[]) {
    return prisma.$transaction(async (tx) => {
      // Fetch existing sections and lessons for cleanup
      const existingSections = await tx.courseSection.findMany({
        where: { courseId },
        include: { lessons: true },
      })

      const existingSectionIds = new Set(existingSections.map((s) => s.id))
      const incomingSectionIds = new Set(sections.filter((s) => s.id).map((s) => s.id!))

      // Delete sections that are no longer in incoming list
      const sectionsToDelete = Array.from(existingSectionIds).filter(
        (id) => !incomingSectionIds.has(id)
      )
      if (sectionsToDelete.length > 0) {
        await tx.courseSection.deleteMany({
          where: { id: { in: sectionsToDelete } },
        })
      }

      // Upsert sections and lessons
      for (let sIdx = 0; sIdx < sections.length; sIdx++) {
        const secInput = sections[sIdx]

        let sectionRecord: any
        if (secInput.id && existingSectionIds.has(secInput.id)) {
          sectionRecord = await tx.courseSection.update({
            where: { id: secInput.id },
            data: {
              title: secInput.title.trim(),
              description: secInput.description?.trim() || null,
              orderIndex: sIdx,
            },
          })
        } else {
          sectionRecord = await tx.courseSection.create({
            data: {
              courseId,
              title: secInput.title.trim(),
              description: secInput.description?.trim() || null,
              orderIndex: sIdx,
            },
          })
        }

        // Handle lessons inside this section
        const existingLessons = existingSections.find((s) => s.id === sectionRecord.id)?.lessons || []
        const existingLessonIds = new Set(existingLessons.map((l) => l.id))
        const incomingLessonIds = new Set(secInput.lessons.filter((l) => l.id).map((l) => l.id!))

        const lessonsToDelete = Array.from(existingLessonIds).filter(
          (id) => !incomingLessonIds.has(id)
        )
        if (lessonsToDelete.length > 0) {
          await tx.lesson.deleteMany({
            where: { id: { in: lessonsToDelete } },
          })
        }

        for (let lIdx = 0; lIdx < secInput.lessons.length; lIdx++) {
          const lesInput = secInput.lessons[lIdx]

          const lessonData = {
            sectionId: sectionRecord.id,
            title: lesInput.title.trim(),
            description: lesInput.description?.trim() || null,
            orderIndex: lIdx,
            isPreview: Boolean(lesInput.isPreview),
            videoUrl: lesInput.videoUrl?.trim() || null,
            videoDuration: lesInput.videoDuration?.trim() || null,
            liveClass: lesInput.liveClass ?? null,
            documents: lesInput.documents ?? null,
            quiz: lesInput.quiz ?? null,
            assignment: lesInput.assignment ?? null,
            resources: lesInput.resources ?? null,
            externalLinks: lesInput.externalLinks ?? null,
          }

          let lessonRecord: any
          if (lesInput.id && existingLessonIds.has(lesInput.id)) {
            lessonRecord = await tx.lesson.update({
              where: { id: lesInput.id },
              data: lessonData,
            })
          } else {
            lessonRecord = await tx.lesson.create({
              data: lessonData,
            })
          }

          // Sync multiple instructors for this lesson
          if (Array.isArray(lesInput.instructorIds)) {
            // Delete old instructors for this lesson
            await tx.lessonInstructor.deleteMany({
              where: { lessonId: lessonRecord.id },
            })

            // Re-create assigned instructors
            if (lesInput.instructorIds.length > 0) {
              await tx.lessonInstructor.createMany({
                data: lesInput.instructorIds.map((inst) => ({
                  lessonId: lessonRecord.id,
                  instructorId: inst.instructorId,
                  role: inst.role || "Instructor",
                })),
              })
            }
          }
        }
      }

      return true
    })
  }

  /**
   * Get all active instructors to populate select dropdowns
   */
  static async getAvailableInstructors() {
    const instructors = await prisma.instructor.findMany({
      where: { status: "ACTIVE" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            selactedImg: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return instructors.map((inst) => ({
      id: inst.id,
      userId: inst.userId,
      instructorId: inst.instructorId,
      name: inst.user.name,
      email: inst.user.email,
      image: inst.user.image,
      selactedImg: inst.user.selactedImg,
      expertise: inst.expertise,
    }))
  }
}
