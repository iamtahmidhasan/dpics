import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { requireProjectCreatorApi } from "@/lib/session"
import { ProjectService } from "@/lib/services/project.service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1", 10)
    const pageSize = parseInt(searchParams.get("pageSize") || "12", 10)
    const search = searchParams.get("q") || undefined
    const category = searchParams.get("category") || undefined
    const techStack = searchParams.get("techStack") || undefined
    const featuredOnly = searchParams.get("featured") === "true"

    const result = await ProjectService.listProjects({
      page,
      pageSize,
      search,
      category,
      techStack,
      featuredOnly,
    })

    return NextResponse.json(result)
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireProjectCreatorApi()
    const body = await request.json()

    const project = await ProjectService.createProject(session.user.id, body, false)
    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    return toErrorResponse(error)
  }
}
