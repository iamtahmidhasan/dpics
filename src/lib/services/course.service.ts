import "server-only"

import prisma from "@/lib/prisma"
import type { CourseLevel } from "@/generated/prisma/enums"
import { resolveUserImage, normalizeImageList } from "@/lib/user-image"

export interface CreateCourseInput {
  title: string
  titleBn?: string | null
  slug: string
  excerpt?: string | null
  excerptBn?: string | null
  description?: string | null
  descriptionBn?: string | null
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
  titleBn?: string | null
  description?: string | null
  descriptionBn?: string | null
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
  titleBn?: string | null
  description?: string | null
  descriptionBn?: string | null
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
        { titleBn: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
        { excerptBn: { contains: search, mode: "insensitive" } },
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
                titleBn: true,
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
                            email: true,
                            image: true,
                            selactedImg: true,
                            member: {
                              select: {
                                studentId: true,
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
              const { avatar } = resolveUserImage(
                normalizeImageList(li.instructor.user.image),
                li.instructor.user.selactedImg
              )
              instructorsMap.set(li.instructor.id, {
                id: li.instructor.id,
                userId: li.instructor.user.id,
                studentId: li.instructor.user.member?.studentId || null,
                instructorId: li.instructor.instructorId,
                name: li.instructor.user.name,
                email: li.instructor.user.email,
                avatar,
                image: avatar,
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
                            bio: true,
                            skills: true,
                            member: {
                              select: {
                                studentId: true,
                              },
                            },
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
          titleBn: lesson.titleBn,
          description: isUnlocked ? lesson.description : null,
          descriptionBn: isUnlocked ? lesson.descriptionBn : null,
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
          instructors: lesson.instructors.map((li) => {
            const { avatar } = resolveUserImage(
              normalizeImageList(li.instructor.user.image),
              li.instructor.user.selactedImg
            )
            return {
              id: li.id,
              userId: li.instructor.user.id,
              studentId: li.instructor.user.member?.studentId || null,
              instructorId: li.instructorId,
              role: li.role,
              name: li.instructor.user.name,
              email: li.instructor.user.email,
              avatar,
              image: avatar,
              rawImages: li.instructor.user.image,
              selactedImg: li.instructor.user.selactedImg,
              skills: li.instructor.user.skills || [],
              expertise: li.instructor.user.skills?.join(", ") || null,
              bio: li.instructor.user.bio || null,
            }
          }),
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

    // Aggregate unique instructors across all lessons
    const courseInstructorsMap = new Map<string, any>()
    for (const s of sanitizedSections) {
      for (const l of s.lessons) {
        for (const inst of l.instructors) {
          const key = inst.instructorId || inst.id
          if (key && !courseInstructorsMap.has(key)) {
            courseInstructorsMap.set(key, inst)
          }
        }
      }
    }

    let courseInstructors = Array.from(courseInstructorsMap.values())
    if (courseInstructors.length === 0) {
      const fallbackInstructors = await prisma.instructor.findMany({
        where: { status: "ACTIVE" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              selactedImg: true,
              bio: true,
              skills: true,
              member: {
                select: {
                  studentId: true,
                },
              },
            },
          },
        },
        take: 3,
      })
      courseInstructors = fallbackInstructors.map((fi) => {
        const { avatar } = resolveUserImage(
          normalizeImageList(fi.user.image),
          fi.user.selactedImg
        )
        return {
          id: fi.id,
          userId: fi.user.id,
          studentId: fi.user.member?.studentId || null,
          instructorId: fi.instructorId,
          role: "Instructor",
          name: fi.user.name,
          email: fi.user.email,
          avatar,
          image: avatar,
          selactedImg: fi.user.selactedImg,
          bio: fi.user.bio || "Senior Instructor at DPI Computing Society.",
          skills: fi.user.skills || [],
          expertise: fi.user.skills?.join(", ") || null,
        }
      })
    }

    return {
      ...course,
      instructors: courseInstructors,
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
        titleBn: data.titleBn?.trim() || null,
        slug: data.slug.trim().toLowerCase(),
        excerpt: data.excerpt?.trim() || null,
        excerptBn: data.excerptBn?.trim() || null,
        description: data.description?.trim() || null,
        descriptionBn: data.descriptionBn?.trim() || null,
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
    if (updateData.titleBn !== undefined) updateData.titleBn = updateData.titleBn?.trim() || null
    if (updateData.slug) updateData.slug = updateData.slug.trim().toLowerCase()
    if (updateData.excerpt !== undefined) updateData.excerpt = updateData.excerpt?.trim() || null
    if (updateData.excerptBn !== undefined) updateData.excerptBn = updateData.excerptBn?.trim() || null
    if (updateData.description !== undefined) updateData.description = updateData.description?.trim() || null
    if (updateData.descriptionBn !== undefined) updateData.descriptionBn = updateData.descriptionBn?.trim() || null
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

        const sectionData = {
          title: secInput.title.trim(),
          titleBn: secInput.titleBn?.trim() || null,
          description: secInput.description?.trim() || null,
          descriptionBn: secInput.descriptionBn?.trim() || null,
          orderIndex: sIdx,
        }

        let sectionRecord: any
        if (secInput.id && existingSectionIds.has(secInput.id)) {
          sectionRecord = await tx.courseSection.update({
            where: { id: secInput.id },
            data: sectionData,
          })
        } else {
          sectionRecord = await tx.courseSection.create({
            data: {
              courseId,
              ...sectionData,
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
            titleBn: lesInput.titleBn?.trim() || null,
            description: lesInput.description?.trim() || null,
            descriptionBn: lesInput.descriptionBn?.trim() || null,
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
            bio: true,
            skills: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return instructors.map((inst) => {
      const { avatar } = resolveUserImage(
        normalizeImageList(inst.user.image),
        inst.user.selactedImg
      )
      return {
        id: inst.id,
        userId: inst.userId,
        instructorId: inst.instructorId,
        name: inst.user.name,
        email: inst.user.email,
        avatar,
        image: avatar,
        rawImages: inst.user.image,
        selactedImg: inst.user.selactedImg,
        skills: inst.user.skills || [],
        expertise: inst.user.skills?.join(", ") || null,
      }
    })
  }
}
