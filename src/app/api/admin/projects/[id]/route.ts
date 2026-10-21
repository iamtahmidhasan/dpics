import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { requireAdmin } from "@/lib/session"
import { ProjectService } from "@/lib/services/project.service"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin()
    const { id } = await context.params
    const project = await ProjectService.getProjectForAdmin(id)
    return NextResponse.json(project)
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireAdmin()
    const { id } = await context.params
    const body = await request.json()

    const updated = await ProjectService.updateProject(id, session.user.id, body, true)
    return NextResponse.json({ success: true, project: updated })
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await requireAdmin()
    const { id } = await context.params

    await ProjectService.deleteProject(id, session.user.id, true)
    return NextResponse.json({ success: true, message: "Project deleted successfully" })
  } catch (error) {
    return toErrorResponse(error)
  }
}
