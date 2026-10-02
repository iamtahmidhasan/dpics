import { type NextRequest, NextResponse } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { CourseService } from "@/lib/services/course.service"
import { requireAdminApi, getSession } from "@/lib/session"
import { isAdmin } from "@/lib/roles"
import type { CourseLevel } from "@/generated/prisma/enums"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || undefined
    const isFreeParam = searchParams.get("isFree")
    const isFree = isFreeParam === "true" ? true : isFreeParam === "false" ? false : undefined
    const level = (searchParams.get("level") as CourseLevel) || undefined

    const session = await getSession()
    const userIsAdmin = session?.user ? isAdmin(session.user) : false

    // If admin is requesting admin list (e.g. ?admin=true), show all courses (published or not)
    const isPublished = userIsAdmin && searchParams.get("admin") === "true" ? undefined : true

    const courses = await CourseService.listCourses({
      isPublished,
      isFree,
      search,
      level,
    })

    return NextResponse.json({ courses })
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminApi()
    const body = await request.json()

    if (!body.title || !body.slug) {
      return NextResponse.json({ error: { message: "Title and slug are required" } }, { status: 400 })
    }

    const course = await CourseService.createCourse(body, session.user.id)
    return NextResponse.json({ course }, { status: 201 })
  } catch (error) {
    return toErrorResponse(error)
  }
}
