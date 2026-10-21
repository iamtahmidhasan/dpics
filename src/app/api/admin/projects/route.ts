import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { requireAdminApi } from "@/lib/session"
import { ProjectService } from "@/lib/services/project.service"

export async function GET(request: NextRequest) {
  try {
    await requireAdminApi()
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get("page") || "1", 10)
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10)
    const search = searchParams.get("q") || undefined
    const status = searchParams.get("status") || undefined
    const categoryId = searchParams.get("categoryId") || undefined
    const authorId = searchParams.get("authorId") || undefined

    const result = await ProjectService.listAdminProjects({
      page,
      pageSize,
      search,
      status,
      categoryId,
      authorId,
    })

    return NextResponse.json(result)
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminApi()
    const body = await request.json()

    const project = await ProjectService.createProject(session.user.id, body, true)
    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    return toErrorResponse(error)
  }
}

