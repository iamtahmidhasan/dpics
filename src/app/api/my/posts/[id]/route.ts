import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { isAdmin } from "@/lib/roles"
import { requirePostWriterApi } from "@/lib/session"
import {
  deletePost,
  getMyPost,
  parsePostUpdateInput,
  updatePost,
} from "@/lib/services/post.service"

async function resolveActor() {
  const session = await requirePostWriterApi()

  return { userId: session.user.id, isAdmin: isAdmin(session.user) }
}

export async function GET(_request: NextRequest, context: RouteContext<"/api/my/posts/[id]">) {
  try {
    const actor = await resolveActor()
    const { id } = await context.params

    return NextResponse.json(await getMyPost(id, actor))
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function PATCH(request: NextRequest, context: RouteContext<"/api/my/posts/[id]">) {
  try {
    const actor = await resolveActor()
    const { id } = await context.params
    const input = parsePostUpdateInput(await request.json())

    // The service refuses edits once the post is approved, and ignores any
    // `status` the payload might carry.
    return NextResponse.json(await updatePost(id, input, actor))
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext<"/api/my/posts/[id]">) {
  try {
    const actor = await resolveActor()
    const { id } = await context.params

    await deletePost(id, actor)

    return NextResponse.json({ success: true })
  } catch (error) {
    return toErrorResponse(error)
  }
}