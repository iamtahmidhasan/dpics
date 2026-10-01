import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { isAdmin } from "@/lib/roles"
import { requireAdminApi } from "@/lib/session"
import {
  deletePostAsAdmin,
  getPostDetailForAdmin,
  parsePostAdminInput,
  updatePostAsAdmin,
} from "@/lib/services/post.service"

export async function GET(_request: NextRequest, context: RouteContext<"/api/admin/posts/[id]">) {
  try {
    await requireAdminApi()
    const { id } = await context.params

    return NextResponse.json(await getPostDetailForAdmin(id))
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function PATCH(request: NextRequest, context: RouteContext<"/api/admin/posts/[id]">) {
  try {
    const session = await requireAdminApi()
    const { id } = await context.params
    const input = parsePostAdminInput(await request.json())

    // Admins edit a post in any workflow state, unlike its author.
    return NextResponse.json(
      await updatePostAsAdmin(id, input, {
        userId: session.user.id,
        isAdmin: isAdmin(session.user),
      })
    )
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext<"/api/admin/posts/[id]">
) {
  try {
    await requireAdminApi()
    const { id } = await context.params

    await deletePostAsAdmin(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return toErrorResponse(error)
  }
}