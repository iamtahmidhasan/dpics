import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import {
  deleteAdminUser,
  getAdminUserDetail,
  parseAdminUserInput,
  updateAdminUser,
} from "@/lib/services/admin-user.service"
import { requireAdminApi } from "@/lib/session"

export async function GET(_request: NextRequest, context: RouteContext<"/api/admin/users/[id]">) {
  try {
    await requireAdminApi()

    const { id } = await context.params

    return NextResponse.json(await getAdminUserDetail(id))
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function PATCH(request: NextRequest, context: RouteContext<"/api/admin/users/[id]">) {
  try {
    const session = await requireAdminApi()
    const { id } = await context.params
    const input = parseAdminUserInput(await request.json())

    return NextResponse.json(await updateAdminUser(id, input, session.user.id))
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext<"/api/admin/users/[id]">) {
  try {
    const session = await requireAdminApi()
    const { id } = await context.params

    await deleteAdminUser(id, session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return toErrorResponse(error)
  }
}