import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { requireUser, isAdmin } from "@/lib/session"
import { ProjectService } from "@/lib/services/project.service"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const project = await ProjectService.getProjectForAdmin(id)
    return NextResponse.json(project)
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireUser()
    const { id } = await context.params
    const body = await request.json()
    const isAdminUser = isAdmin(session.user)

    const updated = await ProjectService.updateProject(id, session.user.id, body, isAdminUser)
    return NextResponse.json({ success: true, project: updated })
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await requireUser()
    const { id } = await context.params
    const isAdminUser = isAdmin(session.user)

    await ProjectService.deleteProject(id, session.user.id, isAdminUser)
    return NextResponse.json({ success: true, message: "Project deleted successfully" })
  } catch (error) {
    return toErrorResponse(error)
  }
}
